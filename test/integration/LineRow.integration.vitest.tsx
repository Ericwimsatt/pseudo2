import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LineRow } from '../../src/App/components/LineRow';
import type { LineRenderable } from '../../src/main/translationService/renderable/types';
import { BUCKET_STYLES } from '../../src/main/translationService/renderable/bucket';

function makeLine(overrides: Partial<LineRenderable>): LineRenderable {
  return {
    lineNumber: 1,
    sourceText: 'const x = 42;',
    bucket: 'standard',
    nodes: [],
    spanningBuckets: [],
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
        bucketStyle={BUCKET_STYLES[line.bucket]}
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

  it('applies bucket class to the row', () => {
    const line = makeLine({ bucket: 'import' });
    renderRow(line);
    const sourceCell = document.querySelector('[data-bucket]');
    expect(sourceCell?.className).toContain('bg-amber-50/60');
  });

  it('shows translation nodes when present', () => {
    const line = makeLine({
      nodes: [{ indent: 0, spans: [{ text: 'import something' }] }],
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

  it('applies rowSpan attribute to translation cell when defined', () => {
    const line = makeLine({
      sourceText: 'function foo({',
      nodes: [{ indent: 0, spans: [{ text: 'function params' }] }],
      translationRowSpan: 3,
    });
    renderRow(line);
    const transCell = document.querySelector('[style*="grid-column: 6"]');
    expect(transCell).toBeTruthy();
    const style = transCell?.getAttribute('style');
    expect(style).toContain('span 3');
  });

  it('does not crash when searchMatches is undefined', () => {
    const line = makeLine({ sourceText: 'const x = 1;' });
    renderRow(line, { searchTerm: undefined, searchMatches: undefined });
    expect(screen.getByText('const x = 1;')).toBeTruthy();
  });
});
