import { describe, it, expect } from 'vitest';
import { renderFileTable } from '../../../src/main/htmlRenderer/fileTableRenderer';

// Build entity strings at runtime to avoid tool escaping issues
const OPEN_ENTITY = String.fromCharCode(38) + 'lt' + String.fromCharCode(59) + 'script' + String.fromCharCode(38) + 'gt' + String.fromCharCode(59);  // = '<script>'
const CLOSE_ENTITY = String.fromCharCode(38) + 'lt' + String.fromCharCode(59) + '/script' + String.fromCharCode(38) + 'gt' + String.fromCharCode(59);  // = '</script>'

const mockDisplayNode = {
  indent: 0,
  spans: [{ text: 'const x = 1' }],
  children: [],
  sourceStartLine: 1,
  sourceEndLine: 1,
  bucket: 'standard',
  nested: false,
};

const mockLineRenderable = {
  lineNumber: 1,
  sourceText: 'const x = 1',
  bucket: 'standard',
  nodes: [mockDisplayNode],
  spanningBuckets: ['standard'],
  boxFragment: null,
};

const mockViewModel = {
  lines: [mockLineRenderable],
};

describe('fileTableRenderer', () => {
  it('renders file table with basic structure', () => {
    const result = renderFileTable({
      viewModel: mockViewModel,
      fileName: 'test.ts',
      filePath: 'test.ts',
      sourcePct: 50,
    });

    expect(result.html).toContain('data-role="file-table"');
    expect(result.html).toContain('data-role="code-grid"');
    expect(result.html).toContain('test.ts');
    expect(result.html).toContain('data-testid="code-grid"');
  });

  it('renders line numbers', () => {
    const result = renderFileTable({
      viewModel: mockViewModel,
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html).toContain('data-role="line-number"');
    expect(result.html).toContain('1');
  });

  it('renders source cells with data attributes', () => {
    const result = renderFileTable({
      viewModel: mockViewModel,
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html).toContain('data-role="source-cell"');
    expect(result.html).toContain('data-line="1"');
    expect(result.html).toContain('data-bucket="standard"');
    expect(result.html).toContain('const x = 1');
  });

  it('renders resize handle', () => {
    const result = renderFileTable({
      viewModel: mockViewModel,
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html).toContain('data-role="resize-handle"');
    expect(result.html).toContain('data-row="1"');
  });

  it('renders selection mode buttons', () => {
    const result = renderFileTable({
      viewModel: mockViewModel,
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html).toContain('data-role="selection-mode-button"');
    expect(result.html).toContain('data-mode="source"');
    expect(result.html).toContain('data-mode="translation"');
    expect(result.html).toContain('data-mode="both"');
  });

  it('renders search controls (hidden by default)', () => {
    const result = renderFileTable({
      viewModel: mockViewModel,
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html).toContain('data-role="search-controls"');
    expect(result.html).toContain('data-testid="search-input"');
    expect(result.html).toContain('data-role="search-prev"');
    expect(result.html).toContain('data-role="search-next"');
    expect(result.html).toContain('data-role="search-close"');
  });

  it('renders box fragments for translation', () => {
    const mockBoxFragment = {
      layers: [],
      contentNode: mockDisplayNode,
    };
    const lineWithBox = {
      ...mockLineRenderable,
      boxFragment: mockBoxFragment,
    };
    const vmWithBox = { lines: [lineWithBox] };

    const result = renderFileTable({
      viewModel: vmWithBox,
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html).toContain('data-role="translation-cell"');
    expect(result.html).toContain('data-role="box-content"');
  });

  it('handles empty source text', () => {
    const emptyLine = {
      ...mockLineRenderable,
      sourceText: '',
    };
    const vmEmpty = { lines: [emptyLine] };

    const result = renderFileTable({
      viewModel: vmEmpty,
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html).toContain('&nbsp;');
  });

  it('escapes HTML in source text', () => {
    const xssLine = {
      ...mockLineRenderable,
      sourceText: '<script>alert(1)</script>',
    };
    const vmXss = { lines: [xssLine] };

    const result = renderFileTable({
      viewModel: vmXss,
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    // The source text should be escaped in the output - check for HTML entities
    // <script> becomes <script> (the literal chars: & l t ; s c r i p t & g t ;)
    // </script> becomes </script>
    expect(result.html).toContain(OPEN_ENTITY);
    expect(result.html).toContain(CLOSE_ENTITY);
    expect(result.html).not.toContain('<script>');
    expect(result.html).not.toContain('</script>');
  });

  it('includes correct metadata', () => {
    const result = renderFileTable({
      viewModel: mockViewModel,
      fileName: 'test.ts',
      filePath: 'test.ts',
      targetSourceLine: 10,
    });

    expect(result.metadata.kind).toBe('file-table');
    expect(result.metadata.filePath).toBe('test.ts');
    expect(result.metadata.lineNumber).toBe(10);
    expect(result.metadata.route).toContain('#/file/test.ts');
    expect(result.metadata.timestamp).toBeTypeOf('number');
  });

  it('renders nested box fragments with multiple layers', () => {
    const nestedBoxFragment = {
      layers: [
        { depth: 0, bucket: 'function', borderRole: 'start' },
        { depth: 1, bucket: 'interface', borderRole: 'single' },
      ],
      contentNode: mockDisplayNode,
    };
    const lineWithNestedBox = {
      ...mockLineRenderable,
      boxFragment: nestedBoxFragment,
    };

    const result = renderFileTable({
      viewModel: { lines: [lineWithNestedBox] },
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html).toContain('data-role="box-layer"');
    expect(result.html).toContain('data-depth="0"');
    expect(result.html).toContain('data-depth="1"');
    expect(result.html).toContain('data-bucket="function"');
    expect(result.html).toContain('data-bucket="interface"');
    expect(result.html).toContain('data-role="box-content"');
  });

  it('renders box fragment with null contentNode', () => {
    const boxFragmentNoContent = {
      layers: [{ depth: 0, bucket: 'standard', borderRole: 'single' }],
      contentNode: null,
    };
    const lineWithEmptyBox = {
      ...mockLineRenderable,
      boxFragment: boxFragmentNoContent,
    };

    const result = renderFileTable({
      viewModel: { lines: [lineWithEmptyBox] },
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html).toContain('data-role="translation-cell"');
    expect(result.html).toContain('select-none');
  });

  it('renders TSX/JSX view model with jsx bucket', () => {
    const jsxDisplayNode = {
      indent: 0,
      spans: [{ text: '<div className="app">' }],
      children: [],
      sourceStartLine: 1,
      sourceEndLine: 1,
      bucket: 'jsx',
      nested: false,
    };
    const jsxLine = {
      lineNumber: 1,
      sourceText: '<div className="app">',
      bucket: 'jsx',
      nodes: [jsxDisplayNode],
      spanningBuckets: ['jsx'],
      boxFragment: null,
    };

    const result = renderFileTable({
      viewModel: { lines: [jsxLine] },
      fileName: 'App.tsx',
      filePath: 'src/App.tsx',
    });

    expect(result.html).toContain('data-bucket="jsx"');
    expect(result.html).toContain('data-line="1"');
    expect(result.html).toContain('border-blue-500');
    // Source text is HTML-escaped: < and " become entities
    expect(result.html).toContain('&lt;div');
    expect(result.html).toContain('className=&quot;app&quot;&gt;');
  });

  it('renders multiple lines with correct row numbers', () => {
    const line1 = { ...mockLineRenderable, lineNumber: 1, sourceText: 'line 1' };
    const line2 = { ...mockLineRenderable, lineNumber: 2, sourceText: 'line 2' };
    const line3 = { ...mockLineRenderable, lineNumber: 3, sourceText: 'line 3' };

    const result = renderFileTable({
      viewModel: { lines: [line1, line2, line3] },
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html).toContain('data-line="1"');
    expect(result.html).toContain('data-line="2"');
    expect(result.html).toContain('data-line="3"');
    expect(result.html).toContain('data-row="1"');
    expect(result.html).toContain('data-row="2"');
    expect(result.html).toContain('data-row="3"');
  });

  it('escapes HTML in filePath attribute', () => {
    const result = renderFileTable({
      viewModel: mockViewModel,
      fileName: 'test.ts',
      filePath: 'src/test<script>.ts',
    });

    const LT = String.fromCharCode(38) + 'lt;';
    const GT = String.fromCharCode(38) + 'gt;';
    expect(result.html).toContain('src/test' + LT + 'script' + GT + '.ts');
    expect(result.html).not.toContain('data-file-path="src/test<script>.ts"');
  });

  it('escapes HTML in fileName', () => {
    const result = renderFileTable({
      viewModel: mockViewModel,
      fileName: 'file<script>.ts',
      filePath: 'file.ts',
    });

    const LT = String.fromCharCode(38) + 'lt;';
    const GT = String.fromCharCode(38) + 'gt;';
    expect(result.html).toContain('file' + LT + 'script' + GT + '.ts');
  });

  it('applies source percentage to grid columns', () => {
    const result = renderFileTable({
      viewModel: mockViewModel,
      fileName: 'test.ts',
      filePath: 'test.ts',
      sourcePct: 70,
    });

    expect(result.html).toContain('data-source-pct="70"');
    expect(result.html).toContain('grid-template-columns: 6px 48px 70%');
  });

  it('renders translation cell with search context', () => {
    const boxFragment = {
      layers: [],
      contentNode: mockDisplayNode,
    };
    const lineWithBox = {
      ...mockLineRenderable,
      boxFragment,
    };

    const result = renderFileTable({
      viewModel: { lines: [lineWithBox] },
      fileName: 'test.ts',
      filePath: 'test.ts',
      targetVar: 'myVar',
    });

    expect(result.html).toContain('data-role="translation-content"');
    expect(result.html).toContain('data-search-context');
  });

  it('renders tooltip container', () => {
    const result = renderFileTable({
      viewModel: mockViewModel,
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html).toContain('data-role="tooltip-container"');
    expect(result.html).toContain('data-testid="tooltip-container"');
  });

  it('renders the shared syntax classes in the source and translation columns', () => {
    const syntaxNode = {
      ...mockDisplayNode,
      spans: [{ text: 'Function', variant: 'kw' as const }],
    };
    const syntaxLine = {
      ...mockLineRenderable,
      sourceSpans: [
        { text: 'const', variant: 'kw' as const },
        { text: ' value' },
      ],
      boxFragment: { layers: [], contentNode: syntaxNode },
    };

    const result = renderFileTable({
      viewModel: { lines: [syntaxLine] },
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html.match(/syntax-keyword/g)).toHaveLength(2);
  });

  it('restores hover attributes without losing nested search highlighting', () => {
    const hoverNode = {
      ...mockDisplayNode,
      spans: [{
        text: 'count',
        variant: 'ident' as const,
        refPos: 42,
        hasHover: true,
      }],
    };
    const hoverLine = {
      ...mockLineRenderable,
      boxFragment: { layers: [], contentNode: hoverNode },
    };

    const result = renderFileTable({
      viewModel: { lines: [hoverLine] },
      fileName: 'test.ts',
      filePath: 'test.ts',
      targetVar: 'count',
    });

    expect(result.html).toContain('class="syntax-token syntax-identifier cursor-help');
    expect(result.html).toContain('data-refpos="42"');
    expect(result.html).toMatch(/data-refpos="42"[^>]*><mark[^>]*>count<\/mark><\/span>/);
  });

  it('does not expose a hover target when hasHover is false', () => {
    const plainNode = {
      ...mockDisplayNode,
      spans: [{ text: 'count', variant: 'ident' as const, refPos: 42 }],
    };
    const plainLine = {
      ...mockLineRenderable,
      boxFragment: { layers: [], contentNode: plainNode },
    };

    const result = renderFileTable({
      viewModel: { lines: [plainLine] },
      fileName: 'test.ts',
      filePath: 'test.ts',
    });

    expect(result.html).not.toContain('data-refpos="42"');
  });
});
