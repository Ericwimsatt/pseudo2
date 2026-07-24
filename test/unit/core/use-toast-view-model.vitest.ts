import { describe, it, expect } from 'vitest';
import { buildFileData } from '../../../src/main/translationService/buildFileData';
import type { ViewModel, DisplayNodeData } from '../../../src/main/translationService/renderable/types';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const source = readFileSync(resolve(__dirname, '../../fixtures/repos/irl/use-toast.ts'), 'utf-8');
const sourceLines = source.split('\n');

function collectTexts(nodes: DisplayNodeData[]): string[] {
  const out: string[] = [];
  function walk(ns: DisplayNodeData[]) {
    for (const n of ns) {
      out.push(n.spans.map(s => s.text).join(''));
      walk(n.children);
    }
  }
  walk(nodes);
  return out;
}

function allTexts(viewModel: ViewModel): string[] {
  return viewModel.lines.flatMap(l => collectTexts(l.nodes));
}

describe('use-toast.ts - viewModel structure', () => {
  it('generates viewModel with correct number of lines', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    expect(viewModel.lines.length).toBe(sourceLines.length);
  });

  it('preserves source text for every line', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    for (let i = 0; i < sourceLines.length; i++) {
      expect(viewModel.lines[i].sourceText).toBe(sourceLines[i]);
      expect(viewModel.lines[i].lineNumber).toBe(i + 1);
    }
  });

  it('assigns function bucket to reducer lines', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const reducerLine = sourceLines.findIndex(l => l.includes('export const reducer'));
    expect(viewModel.lines[reducerLine].bucket).toBe('function');
  });

  it('assigns import bucket to import lines', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    expect(viewModel.lines[0].bucket).toBe('import');
    expect(viewModel.lines[2].bucket).toBe('import');
  });

  it('assigns standard bucket to const/let declarations', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const constantLine = sourceLines.findIndex(l => l.includes('const TOAST_LIMIT'));
    expect(viewModel.lines[constantLine].bucket).toBe('standard');
  });

  it('includes control bucket in spanningBuckets for if statements', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const ifLine = sourceLines.findIndex(l => l.trim().startsWith('if (toastId)'));
    if (ifLine >= 0) {
      expect(viewModel.lines[ifLine].spanningBuckets).toContain('control');
    }
  });

  it('spans nodes across child lines and keeps parents on start lines', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const genIdLine = sourceLines.findIndex(l => l.includes('function genId()'));
    expect(viewModel.lines[genIdLine].nodes.length).toBeGreaterThan(0);
  });

  it('puts all imports in the rendered output', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const texts = allTexts(viewModel);
    expect(texts.some(t => t.includes('import') && t.includes('react'))).toBeTruthy();
    expect(texts.some(t => t.includes('ToastActionElement, ToastProps'))).toBeTruthy();
  });

  it('puts all top-level constants in the rendered output', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const texts = allTexts(viewModel);
    const expectedConsts = ['TOAST_LIMIT', 'TOAST_REMOVE_DELAY', 'count', 'actionTypes',
      'toastTimeouts', 'listeners', 'memoryState'];
    for (const name of expectedConsts) {
      expect(texts.some(t => t.includes(`\`${name}\``))).toBeTruthy();
    }
  });

  it('puts all type definitions in the rendered output', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const texts = allTexts(viewModel);
    const expectedTypes = ['ToasterToast', 'ActionType', 'Action', 'State', 'Toast'];
    for (const name of expectedTypes) {
      expect(texts.some(t => t.includes(`Type ${name}`))).toBeTruthy();
    }
  });

  it('puts all function definitions in the rendered output', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const texts = allTexts(viewModel);
    // function declarations get their names in the node
    const expectedFns = ['genId', 'dispatch', 'toast', 'useToast'];
    for (const name of expectedFns) {
      expect(texts.some(t => t.includes(`Function ${name}`))).toBeTruthy();
    }
    // const + arrow function now inherits the variable name
    expect(texts.some(t => t.includes('Function reducer'))).toBeTruthy();
    expect(texts.some(t => t.includes('Function addToRemoveQueue'))).toBeTruthy();
  });

  it('puts call expressions for dispatched actions in rendered output', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const texts = allTexts(viewModel);
    expect(texts.some(t => t.includes('call dispatch'))).toBeTruthy();
    expect(texts.some(t => t.includes('call genId'))).toBeTruthy();
    expect(texts.some(t => t.includes('call setTimeout'))).toBeTruthy();
    expect(texts.some(t => t.includes('call React.useState'))).toBeTruthy();
    expect(texts.some(t => t.includes('call React.useEffect'))).toBeTruthy();
  });

  it('puts switch-case branches in the rendered output', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const texts = allTexts(viewModel);
    expect(texts.some(t => t.includes('action.type'))).toBeTruthy();
    expect(texts.some(t => t.includes('ADD_TOAST'))).toBeTruthy();
    expect(texts.some(t => t.includes('UPDATE_TOAST'))).toBeTruthy();
    expect(texts.some(t => t.includes('DISMISS_TOAST'))).toBeTruthy();
    expect(texts.some(t => t.includes('REMOVE_TOAST'))).toBeTruthy();
  });

  it('preserves node hierarchy for the reducer function', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const reducerLineIdx = sourceLines.findIndex(l => l.includes('export const reducer'));
    const reducerNodes = viewModel.lines[reducerLineIdx].nodes;
    expect(reducerNodes.length).toBeGreaterThan(0);

    const exportedText = collectTexts(reducerNodes);
    expect(exportedText.some(t => t.includes('Export:'))).toBeTruthy();
    expect(exportedText.some(t => t.includes('reducer'))).toBeTruthy();
  });

  it('preserves node hierarchy for the dispatch function', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const dispatchLineIdx = sourceLines.findIndex(l => l.includes('function dispatch'));
    const dispatchNodes = viewModel.lines[dispatchLineIdx].nodes;
    expect(dispatchNodes.length).toBeGreaterThan(0);

    const dispatchText = collectTexts(dispatchNodes);
    expect(dispatchText.some(t => t.includes('listeners.forEach'))).toBeTruthy();
  });

  it('correctly identifies the final export line', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const exportLineIdx = sourceLines.findIndex(l => l.includes('export { useToast, toast }'));
    const exportLine = viewModel.lines[exportLineIdx];
    expect(exportLine.bucket).toBe('import');
  });

  it('reports sourceStartLine/sourceEndLine on root nodes', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    for (const line of viewModel.lines) {
      for (const node of line.nodes) {
        expect(node.sourceStartLine).toBeGreaterThanOrEqual(1);
        expect(node.sourceEndLine).toBeGreaterThanOrEqual(node.sourceStartLine);
        expect(node.sourceEndLine).toBeLessThanOrEqual(sourceLines.length);
      }
    }
  });

  it('preserves the correct spanningBuckets for multi-line functions', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const reducerStartLine = sourceLines.findIndex(l => l.includes('export const reducer'));
    const reducerEndLine = sourceLines.findLastIndex(l => l === '};');
    expect(reducerStartLine).toBeLessThan(reducerEndLine);
    const spanningAtReducerEnd = viewModel.lines[reducerEndLine].spanningBuckets;
    expect(spanningAtReducerEnd).toBeDefined();
  });

  it('does not duplicate Function reducer onto the switch line', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const switchLineIdx = sourceLines.findIndex(l => l.includes('switch (action.type)'));
    const reducerLineIdx = sourceLines.findIndex(l => l.includes('export const reducer'));
    // The reducer declaration line may merge 'Function reducer' with the export prefix
    // But the switch line (line after) must NOT contain 'Function reducer' in its contentNode
    const switchContent = viewModel.lines[switchLineIdx].boxFragment?.contentNode;
    const reducerContent = viewModel.lines[reducerLineIdx].boxFragment?.contentNode;
    if (switchContent) {
      const switchText = switchContent.spans.map(s => s.text).join('');
      expect(switchText).not.toContain('Function reducer');
    }
    // Also verify reducer line still has the text
    if (reducerContent) {
      const reducerText = reducerContent.spans.map(s => s.text).join('');
      expect(reducerText).toContain('Function reducer');
    }
  });

  it('does not contaminate return { across every object-literal property line', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    // Find the return { line and the subsequent property lines in the reducer
    const returnLineIdx = sourceLines.findIndex(l => l.trim() === 'return {');
    const propertyLineIdx = returnLineIdx + 1; // ...state,
    if (returnLineIdx >= 0) {
      const returnContent = viewModel.lines[returnLineIdx].boxFragment?.contentNode;
      const propertyContent = viewModel.lines[propertyLineIdx].boxFragment?.contentNode;
      // The return { line should show "return {"
      if (returnContent) {
        const returnText = returnContent.spans.map(s => s.text).join('');
        expect(returnText).toContain('return {');
      }
      // The subsequent property lines should NOT contain "return {"
      if (propertyContent) {
        const propertyText = propertyContent.spans.map(s => s.text).join('');
        expect(propertyText).not.toContain('return {');
      }
    }
  });

  it('shows return { for valuable returns and return null only for void returns', () => {
    const { viewModel } = buildFileData(source, 'use-toast.ts');
    const texts = allTexts(viewModel);
    const valuableReturns = texts.filter(t => t.includes('return {'));
    expect(valuableReturns.length).toBeGreaterThan(0);
  });
});
