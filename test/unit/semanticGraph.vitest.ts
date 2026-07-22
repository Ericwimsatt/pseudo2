import { describe, it, expect } from 'vitest';
import { buildFileData } from '../../src/main/translationService/buildFileData';

interface RenderNode {
  spans: { text: string }[];
  children: RenderNode[];
}

function collectTexts(nodes: RenderNode[]): string[] {
  const out: string[] = [];
  function walk(ns: RenderNode[]) {
    for (const n of ns) {
      out.push(n.spans.map(s => s.text).join(''));
      walk(n.children);
    }
  }
  walk(nodes);
  return out;
}

describe('semantic graph - call argument labeling', () => {
  it('labels function arguments as callback with params and shows variable assignment', () => {
    const source = `const timeout = setTimeout(() => {
  toastTimeouts.delete(toastId);
  dispatch({
    type: 'REMOVE_TOAST',
    toastId: toastId,
  });
}, TOAST_REMOVE_DELAY);
`;
    const { viewModel } = buildFileData(source, 'test.ts');

    const texts = collectTexts(viewModel.lines[0].nodes);

    expect(texts.some(t => t.includes('`timeout` ='))).toBeTruthy();
    expect(texts.some(t => t.includes('Call setTimeout'))).toBeTruthy();
    expect(texts.some(t => t.includes('`param_1` ='))).toBeTruthy();
    expect(texts.some(t => t.includes('Function (no parameters)'))).toBeTruthy();
    expect(texts.some(t => t.includes('Call toastTimeouts.delete'))).toBeTruthy();
    expect(texts.some(t => t.includes('`param_2` ='))).toBeTruthy();
    expect(texts.some(t => t.includes('TOAST_REMOVE_DELAY'))).toBeTruthy();
  });

  it('labels inline function args and preserves argument order', () => {
    const source = `const result = execute(a, () => b(), c);
`;
    const { viewModel } = buildFileData(source, 'test.ts');

    const texts = collectTexts(viewModel.lines[0].nodes);

    expect(texts.some(t => t.includes('Call execute'))).toBeTruthy();
    expect(texts.some(t => t.includes('`param_1` = a'))).toBeTruthy();
    expect(texts.some(t => t.includes('`param_2` ='))).toBeTruthy();
    expect(texts.some(t => t.includes('`param_3` = c'))).toBeTruthy();
    expect(texts.some(t => t.includes('Function (no parameters)'))).toBeTruthy();
    expect(texts.some(t => t.includes('return'))).toBeTruthy();
  });

  it('shows variable assignment marker when initializer has children', () => {
    const source = `const x = foo();
const y = 42;
`;
    const { viewModel } = buildFileData(source, 'test.ts');

    // x has a call child → should show =
    const line1Texts = collectTexts(viewModel.lines[0].nodes);
    expect(line1Texts.some(t => t.includes('`x` ='))).toBeTruthy();

    // y has a simple init value → should show = 42
    const line2Texts = collectTexts(viewModel.lines[1].nodes);
    expect(line2Texts.some(t => t.includes('`y` = 42'))).toBeTruthy();
  });

  it('shows Function without trailing period when no params', () => {
    const source = `const f = () => 42;
`;
    const { viewModel } = buildFileData(source, 'test.ts');

    const texts = collectTexts(viewModel.lines[0].nodes);
    expect(texts.some(t => t.includes('`f` ='))).toBeTruthy();
    expect(texts.some(t => t.includes('Function (no parameters)'))).toBeTruthy();
  });
});
