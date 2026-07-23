import { describe, it, expect } from 'vitest';
import { buildFileData } from '../../../src/main/translationService/buildFileData';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const source = readFileSync(resolve(__dirname, '../../fixtures/repos/irl/use-toast.ts'), 'utf-8');

interface RenderNode {
  spans: { text: string }[];
  children: RenderNode[];
}
interface RenderLine {
  nodes: RenderNode[];
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

function render(viewModel: { lines: RenderLine[] }): string[][] {
  return viewModel.lines
    .filter(l => l.nodes.length > 0)
    .map(l => collectTexts(l.nodes));
}

describe('use-toast.ts - semantic graph', () => {
  it('produces nodes for all imports', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    // import * as React from "react" → namespace import, empty name
    expect(all.some(t => t.includes('from react'))).toBeTruthy();
    // import type { ToastActionElement, ToastProps } from "@/components/ui/toast"
    expect(all.some(t => t.includes('ToastActionElement'))).toBeTruthy();
    expect(all.some(t => t.includes('ToastProps'))).toBeTruthy();
    expect(all.some(t => t.includes('@/components/ui/toast'))).toBeTruthy();
  });

  it('produces nodes for all top-level constants', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    expect(all.some(t => t.includes('`TOAST_LIMIT`'))).toBeTruthy();
    expect(all.some(t => t.includes('`TOAST_REMOVE_DELAY`'))).toBeTruthy();
    expect(all.some(t => t.includes('`count`'))).toBeTruthy();
    expect(all.some(t => t.includes('`actionTypes`'))).toBeTruthy();
    expect(all.some(t => t.includes('`toastTimeouts`'))).toBeTruthy();
    expect(all.some(t => t.includes('`listeners`'))).toBeTruthy();
    expect(all.some(t => t.includes('`memoryState`'))).toBeTruthy();
  });

  it('produces nodes for all type and interface definitions', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    expect(all.some(t => t.includes('Type ToasterToast'))).toBeTruthy();
    expect(all.some(t => t.includes('Type ActionType'))).toBeTruthy();
    expect(all.some(t => t.includes('Type Action'))).toBeTruthy();
    expect(all.some(t => t.includes('Type State'))).toBeTruthy();
    expect(all.some(t => t.includes('Type Toast'))).toBeTruthy();
  });

  it('produces function-definition nodes for all top-level functions', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    // function declarations get their name
    const functionTexts = all.filter(t => t.startsWith('Function'));
    expect(functionTexts.some(t => t.includes('genId'))).toBeTruthy();
    expect(functionTexts.some(t => t.includes('dispatch'))).toBeTruthy();
    expect(functionTexts.some(t => t.includes('toast'))).toBeTruthy();
    expect(functionTexts.some(t => t.includes('useToast'))).toBeTruthy();
    // const + arrow function now inherits the variable name
    expect(functionTexts.some(t => t.includes('reducer'))).toBeTruthy();
    expect(functionTexts.some(t => t.includes('addToRemoveQueue'))).toBeTruthy();
    // anonymous for callbacks without variable assignment
    expect(functionTexts.some(t => t.includes('anonymous'))).toBeTruthy();
  });

  it('includes the reducer export in output', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    expect(all.some(t => t.includes('Export:'))).toBeTruthy();
    expect(all.some(t => t.includes('`reducer`'))).toBeTruthy();
  });

  it('includes call expressions for key function invocations', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    expect(all.some(t => t.includes('call genId'))).toBeTruthy();
    expect(all.some(t => t.includes('call dispatch'))).toBeTruthy();
    expect(all.some(t => t.includes('call setTimeout'))).toBeTruthy();
    expect(all.some(t => t.includes('call toastTimeouts.set'))).toBeTruthy();
    expect(all.some(t => t.includes('call toastTimeouts.delete'))).toBeTruthy();
    expect(all.some(t => t.includes('call React.useState'))).toBeTruthy();
    expect(all.some(t => t.includes('call React.useEffect'))).toBeTruthy();
  });

  it('includes the reducer switch statement as if/otherwise-if chain', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    expect(all.some(t => t.includes('action.type'))).toBeTruthy();
    expect(all.some(t => t.includes('ADD_TOAST'))).toBeTruthy();
    expect(all.some(t => t.includes('UPDATE_TOAST'))).toBeTruthy();
    expect(all.some(t => t.includes('DISMISS_TOAST'))).toBeTruthy();
    expect(all.some(t => t.includes('REMOVE_TOAST'))).toBeTruthy();
  });

  it('includes the reducer function body contents', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    expect(all.some(t => t.includes('return:'))).toBeTruthy();
    expect(all.some(t => t.includes('state.toasts.map'))).toBeTruthy();
    expect(all.some(t => t.includes('state.toasts.filter'))).toBeTruthy();
    expect(all.some(t => t.includes('addToRemoveQueue'))).toBeTruthy();
  });

  it('shows return: for valuable returns and return null only for void returns', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();
    // Valuable returns (with expressions) show "return:"
    expect(all.some(t => t.includes('return:'))).toBeTruthy();
    // There is one void return (return; with no expression) at line 58 → shows "return null"
    const returnNulls = all.filter(t => t.trim() === 'return null');
    expect(returnNulls.length).toBe(1);
  });

  it('includes the dispatch function body (listener iteration)', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    expect(all.some(t => t.includes('listeners.forEach'))).toBeTruthy();
  });

  it('includes React hook calls in useToast', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    expect(all.some(t => t.includes('call React.useState'))).toBeTruthy();
    expect(all.some(t => t.includes('call React.useEffect'))).toBeTruthy();
  });

  it('includes the object literal in actionTypes variable', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    const actionTypeLine = all.find(t => t.includes('`actionTypes`'));
    expect(actionTypeLine).toBeTruthy();
  });

  it('includes output for the useToast return object', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    expect(all.some(t => t.includes('return:'))).toBeTruthy();
    expect(all.some(t => t.includes('dismiss'))).toBeTruthy();
    expect(all.some(t => t.includes('toast'))).toBeTruthy();
  });

  it('preserves the final export statement node', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const lines = render(viewModel);
    const all = lines.flat();

    expect(all.some(t => t.includes('export { useToast, toast }')) ||
           all.some(t => t.includes('useToast, toast'))).toBeTruthy();
  });
});
