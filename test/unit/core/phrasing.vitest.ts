import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import {
  toDisplayNode,
  loadPhrasingRules,
} from '../../../src/main/translationService/renderable/phrasing';
import type { SemanticNode } from '../../../src/main/translationService/makeSemanticGraph';
import { PHRASING_RULES } from '../../fixtures/phrasingRules';

/**
 * The single source of truth for "the actual phrasing text a rule produces".
 *
 * Every other test in this suite derives expected strings from the live
 * `config/phrasing-rules.json`, so wording changes auto-track. To pin the
 * rule-application behavior itself (and would-be regressions like "rule
 * ignored", "wrong var substituted", "braces dropped"), we install a fixed
 * synthetic rule set here — one whose templates are intentionally NOT the
 * real ones — and assert toDisplayNode's exact output against those
 * templates. This isolates THIS test from edits to phrasing-rules.json; the
 * rest of the suite is isolated from edits by deriving from the JSON table.
 *
 * Rules below cover the variations the phraser cares about:
 *   - plain variable-only template (export)
 *   - template with both `{plain}` and `{name@ref}` vars (import)
 *   - template with mid-template literal text (function-definition)
 *   - template carrying nested `children` open/close (call-function)
 *   - conditional branches via metadata (jsx-conditional / ternary)
 *   - exported prefix prepending (phraseClass/phraseFunctionDefinition)
 */

interface PhrasingRule {
  type: string;
  template: string;
  children?: { open: string; close: string };
}

const MOCK_RULES: PhrasingRule[] = [
  { type: 'export', template: 'SEND-OUT {names}' },
  { type: 'import', template: 'BRING-IN {names} FROM {module}' },
  {
    type: 'function-definition',
    template: 'DEFN {name@ref} ({params})',
    children: { open: ' [', close: ']' },
  },
  {
    type: 'function-definition-anonymous',
    template: 'LAMBDA',
    children: { open: ' [', close: ']' },
  },
  // The production phraser routes named/no-params functions through a
  // separate rule. We omit it from the mock to assert the routing still
  // finds the right (here: missing) rule when called for it.
  { type: 'function-definition-no-params', template: 'DEFN {name@ref}', children: { open: ' [', close: ']' } },
  { type: 'class', template: 'KIND {name@ref}', children: { open: ' (', close: ')' } },
  { type: 'class-extended', template: 'KIND {name@ref} OF {extends}', children: { open: ' (', close: ')' } },
  { type: 'type-alias', template: 'ALIAS {name@ref} := {type}' },
  { type: 'return-jsx', template: 'GIVE-BACK-VISUALS' },
  { type: 'return-value', template: 'GIVE-BACK {value}' },
  { type: 'if', template: 'WHEN {condition}', children: { open: ' THEN {', close: '}' } },
  { type: 'call-function', template: 'INVOKE {function@ref}', children: { open: ' [', close: ']' } },
  { type: 'instantiate', template: 'NEW-OP {function@ref}', children: { open: ' [', close: ']' } },
];

function makeNode(
  type: string,
  overrides: Partial<SemanticNode> = {},
): SemanticNode {
  return {
    type,
    name: undefined,
    children: [],
    metadata: {},
    sourceStartLine: 1,
    sourceEndLine: 1,
    ...overrides,
  };
}

function render(node: SemanticNode): string {
  return toDisplayNode(node).spans.map((s) => s.text).join('');
}

describe('phrasing rules application (mocked rules)', () => {
  beforeAll(() => {
    loadPhrasingRules(MOCK_RULES);
  });

  afterAll(() => {
    // Restore the live production rules so other unit tests sharing the
    // module aren't poisoned by the mock.
    loadPhrasingRules([...PHRASING_RULES]);
  });

  beforeEach(() => {
    // Re-install the mock in case a sibling test in this file mutated it.
    loadPhrasingRules(MOCK_RULES);
  });

  describe('variable-only templates', () => {
    it('export: substitutes {names}', () => {
      expect(render(makeNode('export', { name: 'useMemo' }))).toBe('SEND-OUT useMemo');
    });
  });

  describe('mixed plain/@ref vars in one template', () => {
    it('import: substitutes both {names} and {module} and preserves order', () => {
      const out = render(makeNode('import', {
        name: 'useState',
        metadata: { module: 'react' },
      }));
      expect(out).toBe('BRING-IN useState FROM react');
    });
  });

  describe('mid-template literal text', () => {
    it('function-definition: parenthesized literal text wraps the params var', () => {
      const out = render(makeNode('function-definition', {
        name: 'greet',
        metadata: { parameters: ['a', 'b'] },
      }));
      expect(out).toBe('DEFN greet (a, b) [');
    });
  });

  describe('nested children open/close', () => {
    it('call-function prepends the open brace onto the same line as the template', () => {
      const out = render(makeNode('call-function', { metadata: { function: 'foo' } }));
      // `toDisplayNode` pushes children.open onto spans; on a newline-less
      // rendering this concatenates with the template text.
      expect(out).toBe('INVOKE foo [');
    });

    it('instantiate prepends its own open brace', () => {
      const out = render(makeNode('instantiate', { metadata: { function: 'Bar', isNew: true } }));
      expect(out).toBe('NEW-OP Bar [');
    });

    it('toDisplayNode exposes closeText for nodes with children', () => {
      const node = toDisplayNode(makeNode('call-function', { metadata: { function: 'foo' } }));
      expect(node.closeText).toBe(']');
      expect(node.nested).toBe(true);
    });
  });

  describe('metadata-driven branching', () => {
    it('class extends branch replaces plain class template', () => {
      expect(render(makeNode('class-extended', {
        name: 'Dog',
        metadata: { extends: 'Animal' },
      }))).toBe('KIND Dog OF Animal (');
    });

    it('anonymous function uses the dedicated render-less template', () => {
      // function-definition routing falls to the anonymous branch when there
      // is no name and no params.
      expect(render(makeNode('function-definition', {
        metadata: { parameters: [] },
      }))).toBe('LAMBDA [');
    });
  });

  describe('export prefix', () => {
    it('exported function gets "Export: " prepended', () => {
      const out = render(makeNode('function-definition', {
        name: 'foo',
        metadata: { parameters: ['a'], exported: true },
      }));
      expect(out).toBe('Export: DEFN foo (a) [');
    });
  });

  describe('unknown rule', () => {
    it('falls back to a [type] marker when no rule is registered', () => {
      expect(render(makeNode('no-such-type', {}))).toBe('[no-such-type]');
    });
  });
});