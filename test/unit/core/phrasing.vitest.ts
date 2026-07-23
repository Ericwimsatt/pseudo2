import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { toDisplayNode, loadPhrasingRules } from '../../../src/main/translationService/renderable/phrasing';
import type { SemanticNode } from '../../../src/main/translationService/makeSemanticGraph';

interface PhrasingRule {
  type: string;
  template: string;
}

// Load the JSON rules
const RULES: PhrasingRule[] = JSON.parse(
  readFileSync(resolve(__dirname, '../../../config/phrasing-rules.json'), 'utf8')
);

beforeAll(() => {
  loadPhrasingRules(RULES);
});

function makeNode(type: string, overrides: Partial<SemanticNode> = {}): SemanticNode {
  return {
    type,
    name: undefined,
    children: [],
    metadata: {},
    indent: 0,
    sourceStartLine: 1,
    sourceEndLine: 1,
    ...overrides,
  };
}

function render(node: SemanticNode): string {
  return toDisplayNode(node).spans.map(s => s.text).join('');
}

/**
 * Map of phrasing type → { nodeOverrides, expectedSubstrings }
 * Tests that each JSON rule produces output containing the expected substrings.
 */
const FIXTURES: Record<string, { node: Partial<SemanticNode>; expected: string[] }> = {
  // ── Imports ──────────────────────────────────────────────
  'import': {
    node: { name: 'useState', metadata: { module: 'react' } },
    expected: ['import { useState } from react'],
  },

  // ── Exports ──────────────────────────────────────────────
  'export': {
    node: { name: 'x', metadata: { module: '' } },
    expected: ['export x'],
  },
  'export-re-export': {
    node: { name: 'x', metadata: { module: './y' } },
    expected: ['export x is re-exported from ./y'],
  },

  // ── Functions ────────────────────────────────────────────
  'function-definition': {
    node: { name: 'foo', metadata: { parameters: ['a', 'b'] } },
    expected: ['Function foo args: { a, b }'],
  },
  'function-definition-no-params': {
    node: { name: 'bar', metadata: { parameters: [] } },
    expected: ['Function bar args: {}'],
  },
  'function-definition-anonymous': {
    node: { metadata: { parameters: [] } },
    expected: ['Function args: {}'],
  },

  // ── Classes ──────────────────────────────────────────────
  'class': {
    node: { name: 'Foo' },
    expected: ['Class Foo'],
  },
  'class-extended': {
    node: { name: 'Foo', metadata: { extends: 'Bar' } },
    expected: ['Class Foo (extends Bar)'],
  },

  // ── Interfaces ───────────────────────────────────────────
  'interface': {
    node: { name: 'Foo' },
    expected: ['Type Foo'],
  },

  // ── Type Aliases ─────────────────────────────────────────
  'type-alias': {
    node: { name: 'Foo', metadata: { type: 'string' } },
    expected: ['Type Foo = string'],
  },

  // ── Properties ───────────────────────────────────────────
  'property': {
    node: { name: 'name', metadata: { type: 'string' } },
    expected: ['`name` is text'],
  },
  'property-with-init': {
    node: { name: 'count', metadata: { type: 'number', initializer: '42' } },
    expected: ['`count` = 42'],
  },

  // ── Variable Assignments ─────────────────────────────────
  'variable-assignment': {
    node: { name: 'x', metadata: { initializer: '42' } },
    expected: ['`x` = 42'],
  },
  'variable-assignment-target': {
    node: { name: 'x', children: [makeNode('call-function', { metadata: { function: 'foo' } })], metadata: { initializer: null } },
    expected: ['`x` = '],
  },

  // ── Returns ──────────────────────────────────────────────
  'return-jsx': {
    node: { metadata: { hasJsx: true } },
    expected: ['Return Visual Elements:'],
  },
  'return-value': {
    node: { metadata: { value: 'x', hasJsx: false } },
    expected: ['return `x`'],
  },
  'return': {
    node: { metadata: { value: null, hasJsx: false } },
    expected: ['return'],
  },
  'return-target': {
    node: { metadata: { value: null, hasJsx: false }, children: [makeNode('call-function', { metadata: { function: 'foo' } })] },
    expected: ['return:'],
  },

  // ── Conditionals ─────────────────────────────────────────
  'if': {
    node: { metadata: { condition: 'x > 0' } },
    expected: ['If x > 0'],
  },
  'otherwise-if': {
    node: { metadata: { condition: 'y > 0' } },
    expected: ['otherwise, if y > 0'],
  },
  'otherwise': {
    node: {},
    expected: ['otherwise,'],
  },

  // ── Ternary ─────────────────────────────────────────────
  'ternary-condition': {
    node: { metadata: { condition: 'reverse' } },
    expected: ['If reverse:'],
  },
  'ternary-otherwise': {
    node: {},
    expected: ['otherwise:'],
  },
  'ternary-value': {
    node: { metadata: { value: 'current <= target' } },
    expected: ['current <= target'],
  },

  // ── Loops ────────────────────────────────────────────────
  'loop-for-of': {
    node: { metadata: { loopType: 'forOf' } },
    expected: ['For each item'],
  },
  'loop-for-in': {
    node: { metadata: { loopType: 'forIn', collection: 'obj' } },
    expected: ['For each item in obj'],
  },
  'loop': {
    node: { metadata: { loopType: 'while' } },
    expected: ['Loop'],
  },

  // ── Calls ────────────────────────────────────────────────
  'call-function': {
    node: { metadata: { function: 'foo' } },
    expected: ['Call foo'],
  },
  'instantiate': {
    node: { metadata: { function: 'Foo', isNew: true } },
    expected: ['Create a Foo'],
  },

  // ── JSX Elements ────────────────────────────────────────
  'jsx-element': {
    node: { name: 'div', metadata: { tagDescription: 'container' } },
    expected: ['<div>'],
  },
  'jsx-self-closing': {
    node: { name: 'br', metadata: { tagDescription: 'line break', selfClosing: true } },
    expected: ['<br />'],
  },
  'jsx-fragment': {
    node: {},
    expected: ['<>…</>'],
  },
  'jsx-list': {
    node: { metadata: { itemName: 'i', collection: 'items' } },
    expected: ['For each i in items:'],
  },
  'jsx-filter': {
    node: { metadata: { collection: 'items', condition: 'x > 0' } },
    expected: ['items where x > 0:'],
  },
  'jsx-conditional': {
    node: { metadata: { condition: 'cond', variant: 'default' } },
    expected: ['When cond, show:'],
  },
  'jsx-conditional-ternary': {
    node: { metadata: { condition: 'cond', variant: 'ternary' } },
    expected: ['If cond, show:'],
  },
  'jsx-conditional-alt': {
    node: { type: 'jsx-conditional-alt' },
    expected: ['Otherwise, show:'],
  },
  'jsx-text': {
    node: { metadata: { text: 'Hello' } },
    expected: ['Text: "Hello"'],
  },
  'jsx-expression-identifier': {
    node: { metadata: { expression: 'name', isSimpleIdentifier: true } },
    expected: ['name'],
  },
  'jsx-expression-template': {
    node: { metadata: { expression: '`Hello ${name}`', isTemplate: true } },
    expected: ['`Hello ${name}`'],
  },
  'jsx-expression': {
    node: { metadata: { expression: 'count + 1' } },
    expected: ['count + 1'],
  },

  // ── Object Literals ──────────────────────────────────────
  'object-literal': {
    node: {},
    expected: ['{'],
  },
  'object-literal-close': {
    node: {},
    expected: ['}'],
  },
  'object-property': {
    node: { name: 'a', metadata: { value: '1' } },
    expected: ['a: 1'],
  },
  'object-property-method': {
    node: { name: 'methodName', metadata: { value: '<method>', isMethod: true } },
    expected: ['methodName()'],
  },
  'object-property-spread': {
    node: { name: '...other', metadata: { value: '', isSpread: true } },
    expected: ['...other'],
  },

  // ── Export prefix ────────────────────────────────────────
  'class-exported': {
    node: { name: 'Foo', metadata: { exported: true } },
    expected: ['Export: ', 'Class Foo'],
  },
  'function-definition-exported': {
    node: { name: 'foo', metadata: { parameters: ['a'], exported: true } },
    expected: ['Export: ', 'Function foo args: { a }'],
  },
};

// ── Data-Driven Tests ──────────────────────────────────────

describe('data-driven phrasing', () => {
  // Ensure every JSON rule type has a corresponding fixture
  it('covers all JSON phrasing rules', () => {
    for (const rule of RULES) {
      expect(FIXTURES[rule.type]).toBeDefined(`Missing fixture for "${rule.type}"`);
    }
  });

  // Test each rule
  for (const rule of RULES) {
    const fixture = FIXTURES[rule.type];
    if (!fixture) continue;

    it(`[${rule.type}] renders correctly`, () => {
      const node = makeNode(rule.type, fixture.node);
      const result = render(node);
      for (const substr of fixture.expected) {
        expect(result).toContain(substr);
      }
    });
  }
});

// ── Additional Edge Case Tests ─────────────────────────────

describe('phrasing edge cases', () => {
  it('falls back for unknown node type', () => {
    const node = makeNode('unknown-node-type', {});
    expect(render(node)).toContain('[unknown-node-type]');
  });

  it('handles jsx-element with attributes', () => {
    const node = makeNode('jsx-element', {
      name: 'div',
      metadata: {
        tagDescription: 'container',
        className: '"flex"',
        classNameDescription: 'flex layout',
        events: [{ name: 'onClick', description: 'when clicked', handlerName: 'handleClick' }],
      },
    });
    const result = render(node);
    expect(result).toContain('<div');
    expect(result).toContain('className');
    expect(result).toContain('onClick');
  });
});
