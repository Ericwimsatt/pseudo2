import { describe, expect, it } from 'vitest';
import {
  highlightSourceLines,
  highlightTranslationSpans,
} from '../../../src/main/translationService/renderable/syntaxHighlight';
import { buildFileData } from '../../../src/main/translationService/buildFileData';
import { renderFileTable } from '../../../src/main/htmlRenderer/fileTableRenderer';

describe('syntaxHighlight', () => {
  it('classifies TypeScript while preserving the original source text', () => {
    const source = 'export const count = 42;';
    const [spans] = highlightSourceLines(source, 'example.ts');

    expect(spans.map(span => span.text).join('')).toBe(source);
    expect(spans).toContainEqual({ text: 'export', variant: 'kw' });
    expect(spans).toContainEqual({ text: 'count', variant: 'ident' });
    expect(spans).toContainEqual({ text: '42', variant: 'number' });
  });

  it('classifies TSX tags, attributes, and string values', () => {
    const source = '<Button title="Save">Go</Button>';
    const [spans] = highlightSourceLines(source, 'example.tsx');

    expect(spans.map(span => span.text).join('')).toBe(source);
    expect(spans).toContainEqual({ text: 'Button', variant: 'tag-name' });
    expect(spans).toContainEqual({ text: 'title', variant: 'attr-name' });
    expect(spans).toContainEqual({ text: '"Save"', variant: 'string' });
  });

  it('keeps multiline comments highlighted on every source line', () => {
    const source = '/* first\n * second */\nconst done = true;';
    const lines = highlightSourceLines(source, 'example.ts');

    expect(lines.map(line => line.map(span => span.text).join('')).join('\n')).toBe(source);
    expect(lines[0]).toContainEqual({ text: '/* first', variant: 'comment' });
    expect(lines[1]).toContainEqual({ text: ' * second */', variant: 'comment' });
  });

  it('uses the same variants for translated syntax and preserves hover metadata', () => {
    const spans = highlightTranslationSpans([
      { text: 'Function ' },
      { text: 'save', variant: 'fn-name', refPos: 12, hasHover: true },
      { text: '(42)' },
    ]);

    expect(spans).toContainEqual({ text: 'Function', variant: 'kw' });
    expect(spans).toContainEqual({
      text: 'save',
      variant: 'fn-name',
      refPos: 12,
      hasHover: true,
    });
    expect(spans).toContainEqual({ text: '42', variant: 'number' });
  });

  it('carries source colors and translated hover targets through the HTML renderer', () => {
    const source = 'export function Demo() {\n  return null;\n}';
    const { viewModel } = buildFileData(source, 'Demo.ts');
    const fragment = renderFileTable({
      viewModel,
      fileName: 'Demo.ts',
      filePath: 'Demo.ts',
    });

    expect(fragment.html).toContain('syntax-keyword');
    expect(fragment.html).toContain('cursor-help');
    expect(fragment.html).toMatch(/data-refpos="\d+"/);
  });
});
