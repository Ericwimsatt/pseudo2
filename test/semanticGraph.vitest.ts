import { describe, it, expect } from 'vitest';
import { buildFileData } from '../src/lib/buildFileData';

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

    // Line 1: variable declaration with = and setTimeout call
    const line1 = lines[0];
    const line1Texts = line1.nodes.map((n: any) => n.spans.map((s: any) => s.text).join(''));
    expect(line1Texts.some((t: string) => t.includes('`timeout` ='))).toBeTruthy();
    expect(line1Texts.some((t: string) => t.includes('Call setTimeout with callback(), TOAST_REMOVE_DELAY'))).toBeTruthy();
    expect(line1Texts.some((t: string) => t.includes('Function anonymous'))).toBeTruthy();

    // Line 2: the callback body — first statement
    const line2 = lines[1];
    const line2Texts = line2.nodes.map((n: any) => n.spans.map((s: any) => s.text).join(''));
    expect(line2Texts.some((t: string) => t.includes('Call toastTimeouts.delete with toastId'))).toBeTruthy();
  });

  it('labels inline function args and preserves argument order', () => {
    const source = `const result = execute(a, () => b(), c);
`;
    const { viewModel } = buildFileData(source, 'test.ts');

    const lines = viewModel.lines.filter((l: any) => l.nodes.length > 0);
    const line1 = lines[0];
    const line1Texts = line1.nodes.map((n: any) => n.spans.map((s: any) => s.text).join(''));
    const callText = line1Texts.find((t: string) => t.includes('Call'));
    // Arguments should appear in order: a, callback(), c
    expect(callText).toBeDefined();
    if (callText) {
      expect(callText).toContain(' a, ');
      expect(callText).toContain('callback()');
      expect(callText).toContain(', c');
    }
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
    const fnText = line1Texts.find((t: string) => t.includes('Function f'));
    expect(fnText).toBe('Function f');
  });
});
