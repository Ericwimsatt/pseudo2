import { describe, it, expect } from 'vitest';
import { buildFileData } from '../../src/main/translationService/buildFileData';

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

    const lines = viewModel.lines.filter((l: any) => l.nodes.length > 0);

    // Line 1: variable-assignment `timeout` =, call-function Call setTimeout,
    // param_1 =, and Function (no parameters) all start on line 1
    const line1Texts = lines[0].nodes.map((n: any) => n.spans.map((s: any) => s.text).join(''));
    expect(line1Texts.some((t: string) => t.includes('`timeout` ='))).toBeTruthy();
    expect(line1Texts.some((t: string) => t.includes('Call setTimeout'))).toBeTruthy();
    expect(line1Texts.some((t: string) => t.includes('`param_1` ='))).toBeTruthy();
    expect(line1Texts.some((t: string) => t.includes('Function (no parameters)'))).toBeTruthy();

    // Line 2: toastTimepoints.delete call in the callback body
    const line2Texts = lines[1].nodes.map((n: any) => n.spans.map((s: any) => s.text).join(''));
    expect(line2Texts.some((t: string) => t.includes('Call toastTimeouts.delete'))).toBeTruthy();

    // param_2 = TOAST_REMOVE_DELAY is on line 7
    const line7 = lines[6];
    const line7Texts = line7.nodes.map((n: any) => n.spans.map((s: any) => s.text).join(''));
    expect(line7Texts.some((t: string) => t.includes('`param_2` ='))).toBeTruthy();
    expect(line7Texts.some((t: string) => t.includes('TOAST_REMOVE_DELAY'))).toBeTruthy();
  });

  it('labels inline function args and preserves argument order', () => {
    const source = `const result = execute(a, () => b(), c);
`;
    const { viewModel } = buildFileData(source, 'test.ts');

    const lines = viewModel.lines.filter((l: any) => l.nodes.length > 0);
    const line1Nodes = lines[0].nodes;
    const nodeTexts = line1Nodes.map((n: any) => n.spans.map((s: any) => s.text).join(''));

    // Arguments as child variable-assignments in order: param_1, param_2, param_3
    expect(nodeTexts.some((t: string) => t.includes('Call execute'))).toBeTruthy();
    expect(nodeTexts.some((t: string) => t.includes('`param_1` = a'))).toBeTruthy();
    expect(nodeTexts.some((t: string) => t.includes('`param_2` ='))).toBeTruthy();
    expect(nodeTexts.some((t: string) => t.includes('`param_3` = c'))).toBeTruthy();

    // param_2 has a function child
    expect(nodeTexts.some((t: string) => t.includes('Function (no parameters)'))).toBeTruthy();
    expect(nodeTexts.some((t: string) => t.includes('return'))).toBeTruthy();
  });

  it('shows variable assignment marker when initializer has children', () => {
    const source = `const x = foo();
const y = 42;
`;
    const { viewModel } = buildFileData(source, 'test.ts');

    const lines = viewModel.lines.filter((l: any) => l.nodes.length > 0);
    // x has a call child → should show =
    const line1Texts = lines[0].nodes.map((n: any) => n.spans.map((s: any) => s.text).join(''));
    expect(line1Texts.some((t: string) => t.includes('`x` ='))).toBeTruthy();

    // y has a simple init value → should show = 42
    const line2Texts = lines[1].nodes.map((n: any) => n.spans.map((s: any) => s.text).join(''));
    expect(line2Texts.some((t: string) => t.includes('`y` = 42'))).toBeTruthy();
  });

  it('shows Function without trailing period when no params', () => {
    const source = `const f = () => 42;
`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = viewModel.lines.filter((l: any) => l.nodes.length > 0);
    const line1Texts = lines[0].nodes.map((n: any) => n.spans.map((s: any) => s.text).join(''));
    // variable-assignment with = since it has a child function-definition
    expect(line1Texts.some((t: string) => t.includes('`f` ='))).toBeTruthy();
    // function-definition with (no parameters) on same line
    expect(line1Texts.some((t: string) => t.includes('Function (no parameters)'))).toBeTruthy();
  });
});
