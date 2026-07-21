import { describe, it, expect } from 'vitest';
import { buildViewModel } from '../../../src/main/translationService/renderable/viewModel';
import type { SemanticNode } from '../../../src/main/translationService/makeSemanticGraph';

function makeNode(type: string, startLine: number, endLine: number, extra: Partial<SemanticNode> = {}): SemanticNode {
  return {
    type,
    children: [],
    metadata: {},
    indent: 0,
    sourceStartLine: startLine,
    sourceEndLine: endLine,
    ...extra,
  };
}

describe('buildViewModel', () => {
  it('preserves node hierarchy in flat output', () => {
    const child = makeNode('variable-assignment', 2, 2, { name: 'child' });
    const parent = makeNode('function-definition', 1, 3, {
      name: 'foo',
      children: [child],
    });
    const vm = buildViewModel([parent], 'line1\nline2\nline3');
    expect(vm.lines.length).toBe(3);
  });

  it('filters out nodes with sourceStartLine = 0', () => {
    const node = makeNode('variable-assignment', 0, 2, { name: 'ignored' });
    const vm = buildViewModel([node], 'line1\nline2');
    expect(vm.lines[0].nodes.length).toBe(0);
  });

  it('produces correct TranslationRowSpan for multi-line nodes', () => {
    const node = makeNode('function-definition', 1, 3, {
      name: 'foo',
      children: [],
    });
    const vm = buildViewModel([node], 'function foo() {\n  // comment\n}');
    expect(vm.lines[0].nodes.length).toBeGreaterThan(0);
  });

  it('handles empty node list', () => {
    const vm = buildViewModel([], 'line1\nline2');
    expect(vm.lines.length).toBe(2);
    expect(vm.lines.every(l => l.nodes.length === 0)).toBe(true);
  });

  it('handles empty source code', () => {
    const vm = buildViewModel([], '');
    expect(vm.lines.length).toBe(1);
    expect(vm.lines[0].sourceText).toBe('');
  });

  it('applies row spans when next line has no nodes', () => {
    const node = makeNode('function-definition', 1, 3, { name: 'foo' });
    const vm = buildViewModel([node], 'line1\nline2\nline3');
    expect(vm.lines[0].nodes.length).toBeGreaterThan(0);
  });
});
