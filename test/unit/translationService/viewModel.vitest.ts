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

  it('renders `as const` object literal one-row-per-source-line, mirroring source', async () => {
    const source = await readFile(join(IRL, 'use-toast.ts'), 'utf-8');
    const { viewModel } = buildFileData(source, 'use-toast.ts');

    // Lines 15-20 of use-toast.ts:
    //   const actionTypes = {
    //     ADD_TOAST: "ADD_TOAST",
    //     UPDATE_TOAST: "UPDATE_TOAST",
    //     DISMISS_TOAST: "DISMISS_TOAST",
    //     REMOVE_TOAST: "REMOVE_TOAST",
    //   } as const;
    //
    // The translation must mirror this row-by-row rather than collapsing the
    // whole literal onto the single L15 row (which used to happen because
    // `AsExpression` was unhandled and the whole initializer fell back to the
    // whitespace-flattening `truncate(initializer.getText())` path).
    const l15 = lineText(viewModel.lines[14]);
    const l16 = lineText(viewModel.lines[15]);
    const l17 = lineText(viewModel.lines[16]);
    const l18 = lineText(viewModel.lines[17]);
    const l19 = lineText(viewModel.lines[18]);
    const l20 = lineText(viewModel.lines[19]);

    expect(l15).toContain(VAR_PREFIX('actionTypes'));
    expect(l15).toContain('{');
    expect(l15).not.toContain('ADD_TOAST');

    expect(l16).toContain('ADD_TOAST');
    expect(l17).toContain('UPDATE_TOAST');
    expect(l18).toContain('DISMISS_TOAST');
    expect(l19).toContain('REMOVE_TOAST');

    // The `as const` suffix rides on the close-brace row, not collapsed away.
    expect(l20).toContain('}');
    expect(l20).toContain('as const');
  });

  it('inlines `useState` value for `const [state, setState] = React.useState(memoryState)`', async () => {
    const source = await readFile(join(IRL, 'use-toast.ts'), 'utf-8');
    const { viewModel } = buildFileData(source, 'use-toast.ts');

    // Line 167 in use-toast.ts.
    const rendered = lineText(viewModel.lines[166]);
    expect(rendered).toContain(VAR_PREFIX('[state, setState]') + phraseOpen('call-function', { function: 'React.useState' }));
    expect(rendered).not.toMatch(/`\[state, setState\]`\s*=\s*\n/);
  });

  it('renders single-line type aliases on one row (no per-line decomposition)', () => {
    const source = `export type Period = "daily" | "weekly" | "monthly";\n`;
    const { viewModel } = buildFileData(source, 'types.ts');
    const rendered = lineText(viewModel.lines[0]);
    expect(rendered).toContain('Type');
    expect(rendered).toContain('Period');
    expect(rendered).toContain('daily');
    expect(rendered).toContain('monthly');
  });
});

describe('viewModel (multi-line type alias mirroring)', () => {
  const IRL = join(FIXTURE_DIR, 'irl');

  beforeEach(() => {
    clearCache();
    setRepoPath(IRL);
  });

  // Source spans L31-L47 of use-toast.ts:
  //
  //   type Action =
  //     | { type: ActionType["ADD_TOAST"]; toast: ToasterToast; }
  //     | { ... UPDATE_TOAST ... }
  //     | { ... DISMISS_TOAST ... }
  //     | { ... REMOVE_TOAST ... };
  //
  // Previously the entire RHS got stuffed onto the L31 row as one big multi-line
  // string while L32-L47 stayed empty -> vertical misalignment with source.
  // Now each body source line gets its own translated row.
  it('renders multi-line discriminated-union type alias one row per source line', async () => {
    const source = await readFile(join(IRL, 'use-toast.ts'), 'utf-8');
    const { viewModel } = buildFileData(source, 'use-toast.ts');

    const l31 = lineText(viewModel.lines[30]);
    const l32 = lineText(viewModel.lines[31]);
    const l33 = lineText(viewModel.lines[32]);
    const l47 = lineText(viewModel.lines[46]);

    // Header row carries only the `Type \`Action\` =` LHS; the body lives on
    // its own source rows.
    expect(l31).toContain('Type');
    expect(l31).toContain('Action');
    expect(l31).not.toContain('ADD_TOAST');
    expect(l31).not.toContain('UPDATE_TOAST');

    // Each union member opener (`| {`) lands on its own source row.
    expect(l32.trim()).toBe('| {');
    expect(l33).toContain('ADD_TOAST');

    // The trailing `;` of the final member stays on its own row, not glued
    // onto L31.
    expect(l47).toContain('}');
    expect(l47).toContain(';');
  });
});