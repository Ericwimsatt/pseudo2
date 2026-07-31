import { describe, it, expect, beforeEach } from 'vitest';
import { join } from 'path';
import { readFile } from 'fs/promises';
import {
  setRepoPath,
  clearCache,
} from '../../../src/main/translationService/cache/projectCache';
import { buildFileData } from '../../../src/main/translationService/buildFileData';
import type {
  DisplaySpan,
  LineRenderable,
} from '../../../src/main/translationService/renderable/types';
import {
  renderTemplate,
  phraseSingleLine,
  phraseOpen,
} from '../../fixtures/phrasingRules';

const FIXTURE_DIR = join(import.meta.dirname, '..', '..', 'fixtures', 'repos');

// Phrasing-fragments pulled from config/phrasing-rules.json via
// test/fixtures/phrasingRules.ts so edits to the rule templates don't require
// touching these tests.
const MAP_INLINE = phraseSingleLine('instantiate', { function: 'Map' });
const SET_INLINE = phraseSingleLine('instantiate', { function: 'Set' });
const VAR_PREFIX = (name: string) =>
  renderTemplate('variable-assignment-target', { name });

function spansToText(spans: DisplaySpan[]): string {
  return spans.map(s => s.text).join('');
}

function lineText(line: LineRenderable): string {
  const node = line.boxFragment?.contentNode;
  if (!node) return '';
  return spansToText(node.spans);
}

describe('viewModel (instantiate braces)', () => {
  beforeEach(() => {
    clearCache();
    setRepoPath(join(FIXTURE_DIR, 'language-features'));
  });

  // Reproduces the bug where `new Map<string, ...>()` (typed, no args) missed
  // its closing brace `{` when declared on the same line as its variable.
  it('renders closing brace for empty typed Map on a single line', () => {
    const source = `const lookup = new Map<string, number>();\n`;
    const { viewModel } = buildFileData(source, 'Collections.tsx');
    const rendered = lineText(viewModel.lines[0]);
    expect(rendered).toContain(MAP_INLINE);
    expect(rendered).not.toMatch(/create a Map \{\s*\n\s*\n/);
    expect(rendered.indexOf('}')).toBeGreaterThan(rendered.indexOf('{'));
  });

  // Sanity-check the multi-line callable form still retains its close brace
  // on its own when on its own line.
  it('renders closing brace for empty Set on a single line', () => {
    const source = `const unique = new Set();\n`;
    const { viewModel } = buildFileData(source, 'Collections.tsx');
    const rendered = lineText(viewModel.lines[0]);
    expect(rendered).toContain(SET_INLINE);
  });
});

// Regression test for the visual staircase produced when an assignment's
// value (e.g. a call, an `await`, an arrow assignment) starts on the same
// source line as the variable. Previously the value was emitted on a new
// line indented one level deeper than its own LHS, producing a staircase
// of the form:
//
//   `timeout` = 
//     call setTimeout {
//       `handler` = 
//         Function args: {} { 
//
// The renderer now keeps the value on the SAME line as the `=`, and the
// first child of the value block indented one step past the value:
//
//   `timeout` = call setTimeout {
//     `handler` = Function args: {} { 
describe('viewModel (inline assignment values)', () => {
  const IRL = join(FIXTURE_DIR, 'irl');

  beforeEach(() => {
    clearCache();
    setRepoPath(IRL);
  });

  it('keeps the assigned value on the same line as the LHS for `const x = new Map()`', () => {
    const { viewModel } = buildFileData(`const lookup = new Map<string, number>();\n`, 'Collections.tsx');
    const rendered = lineText(viewModel.lines[0]);
    expect(rendered).toContain(VAR_PREFIX('lookup') + MAP_INLINE);
    // No newline between `= ` and the value:
    expect(rendered).not.toMatch(/`lookup`\s*=\s*\n/);
  });

  it('does not push the assigned value onto its own deeper-indented line', async () => {
    const source = await readFile(join(IRL, 'use-toast.ts'), 'utf-8');
    const { viewModel } = buildFileData(source, 'use-toast.ts');

    // Line 60: `  const timeout = setTimeout(() => {`
    const rendered = lineText(viewModel.lines[59]);
    // value inlined after `= `
    expect(rendered).toContain(VAR_PREFIX('timeout') + phraseOpen('call-function', { function: 'setTimeout' }));
    // first child of the call block inlined with `handler = `
    expect(rendered).toContain(VAR_PREFIX('handler') + phraseOpen('function-definition-anonymous', {}));
    // The old regression: value dropped onto a new line indented deeper
    // than the LHS.
    expect(rendered).not.toMatch(/`timeout`\s*=\s*\n\s+call setTimeout/);
  });

  it('inlines `useState` value for `const [state, setState] = React.useState(memoryState)`', async () => {
    const source = await readFile(join(IRL, 'use-toast.ts'), 'utf-8');
    const { viewModel } = buildFileData(source, 'use-toast.ts');

    // Line 167 in use-toast.ts.
    const rendered = lineText(viewModel.lines[166]);
    expect(rendered).toContain(VAR_PREFIX('[state, setState]') + phraseOpen('call-function', { function: 'React.useState' }));
    expect(rendered).not.toMatch(/`\[state, setState\]`\s*=\s*\n/);
  });
});