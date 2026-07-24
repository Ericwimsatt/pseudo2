import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LineRow } from '../../src/App/components/LineRow';
import type { LineRenderable } from '../../src/main/translationService/renderable/types';
function makeLine(overrides: Partial<LineRenderable>): LineRenderable {
  return {
    lineNumber: 1,
    sourceText: 'const x = 42;',
    bucket: 'standard',
    nodes: [],
    spanningBuckets: [],
    boxFragment: null,
    ...overrides,
  };
}

function renderRow(line: LineRenderable, overrides: Record<string, any> = {}) {
  return render(
    <div style={{ display: 'grid', gridTemplateColumns: '6px 48px 1fr 4px 20px 1fr' }}>
      <LineRow
        line={line}
        lineIndex={0}
        rowNum={1}
        isInterface={false}
        onResizeStart={vi.fn()}
        {...overrides}
      />
    </div>
  );
}

describe('LineRow', () => {
  it('renders source text', () => {
    const line = makeLine({ sourceText: 'const x = 42;' });
    renderRow(line);
    expect(screen.getByText('const x = 42;')).toBeTruthy();
  });

  it('shows line number in the second cell', () => {
    const line = makeLine({ lineNumber: 7 });
    renderRow(line);
    expect(screen.getByText('7')).toBeTruthy();
  });

  it('sets data-bucket attribute on the row', () => {
    const line = makeLine({ bucket: 'import' });
    renderRow(line);
    const sourceCell = document.querySelector('[data-bucket]');
    expect(sourceCell?.getAttribute('data-bucket')).toBe('import');
  });

  it('shows translation content when boxFragment is present', () => {
    const line = makeLine({
      boxFragment: {
        layers: [],
        contentNode: { indent: 0, spans: [{ text: 'import something' }], children: [], sourceStartLine: 1, sourceEndLine: 1, bucket: 'import', nested: false },
      },
    });
    renderRow(line);
    expect(screen.getByText('import something')).toBeTruthy();
  });

  it('shows nbsp for empty source text', () => {
    const line = makeLine({ sourceText: '' });
    renderRow(line);
    expect(document.querySelector('[data-line]')).toBeTruthy();
  });

  it('renders search highlight marks when searchTerm is provided', () => {
    const line = makeLine({ sourceText: 'hello world' });
    renderRow(line, { searchTerm: 'hello', searchMatches: [{ lineIndex: 0, inSource: true, inTranslation: false }] });
    const marks = document.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThan(0);
    expect(marks[0].textContent).toBe('hello');
  });

  it('applies active match highlight (yellow-300) for active source match', () => {
    const line = makeLine({ sourceText: 'hello world' });
    renderRow(line, {
      searchTerm: 'hello',
      searchMatches: [{ lineIndex: 0, inSource: true, inTranslation: false }],
      activeMatchIndex: 0,
    });
    const mark = document.querySelector('mark');
    expect(mark?.className).toContain('bg-yellow-300');
  });

  it('applies inactive match highlight (yellow-100) for non-active match', () => {
    const line = makeLine({ sourceText: 'hello world' });
    renderRow(line, {
      searchTerm: 'world',
      searchMatches: [{ lineIndex: 0, inSource: true, inTranslation: false }],
      activeMatchIndex: -1,
    });
    const mark = document.querySelector('mark');
    expect(mark?.className).toContain('bg-yellow-100');
  });

  it('renders boxFragment content when present', () => {
    const line = makeLine({
      sourceText: 'function foo()',
      boxFragment: {
        layers: [{ depth: 0, bucket: 'function', borderRole: 'single' }],
        contentNode: { indent: 0, spans: [{ text: 'Function foo' }], children: [], sourceStartLine: 1, sourceEndLine: 1, bucket: 'function', nested: true },
      },
    });
    renderRow(line);
    expect(screen.getByText('Function foo')).toBeTruthy();
  });

  it('renders layered box borders for multiline nodes', () => {
    const line = makeLine({
      sourceText: 'function bar()',
      boxFragment: {
        layers: [
          { depth: 0, bucket: 'function', borderRole: 'start' },
          { depth: 1, bucket: 'control', borderRole: 'continue' },
        ],
        contentNode: { indent: 0, spans: [{ text: 'Function bar' }], children: [], sourceStartLine: 1, sourceEndLine: 5, bucket: 'function', nested: true },
      },
    });
    renderRow(line);
    expect(screen.getByText('Function bar')).toBeTruthy();
  });

  it('does not crash when searchMatches is undefined', () => {
    const line = makeLine({ sourceText: 'const x = 1;' });
    renderRow(line, { searchTerm: undefined, searchMatches: undefined });
    expect(screen.getByText('const x = 1;')).toBeTruthy();
  });
});
