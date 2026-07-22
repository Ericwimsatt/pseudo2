import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildFileData } from '../../src/main/translationService/buildFileData';
import type { LineRenderable } from '../../src/main/translationService/renderable/types';
import CodeTable, { computeMatches, dedupMatches, parentIndices, type SearchMatch } from '../../src/App/components/CodeTable';

vi.mock('@floating-ui/react', () => ({
  useFloating: () => ({ refs: { setReference: vi.fn(), setFloating: vi.fn() }, floatingStyles: {} }),
  autoUpdate: () => vi.fn(),
  offset: () => () => ({}),
  flip: () => () => ({}),
  shift: () => () => ({}),
  FloatingPortal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function makeLine(overrides: Partial<LineRenderable>): LineRenderable {
  return {
    lineNumber: 1,
    sourceText: '',
    bucket: 'standard',
    nodes: [],
    spanningBuckets: [],
    ...overrides,
  };
}

describe('computeMatches', () => {
  it('matches all lines when search term is empty string', () => {
    const lines = [makeLine({ sourceText: 'hello' })];
    const matches = computeMatches(lines, '');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ lineIndex: 0, inSource: true, inTranslation: false });
  });

  it('finds match in source text', () => {
    const lines = [makeLine({ sourceText: 'hello world' })];
    const matches = computeMatches(lines, 'hello');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ lineIndex: 0, inSource: true, inTranslation: false });
  });

  it('finds match in translation text', () => {
    const lines = [makeLine({
      sourceText: 'foo',
      nodes: [{ indent: 0, spans: [{ text: 'bar translation' }] }],
    })];
    const matches = computeMatches(lines, 'translation');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ lineIndex: 0, inSource: false, inTranslation: true });
  });

  it('finds match in both source and translation', () => {
    const lines = [makeLine({
      sourceText: 'hello world',
      nodes: [{ indent: 0, spans: [{ text: 'hello again' }] }],
    })];
    const matches = computeMatches(lines, 'hello');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ lineIndex: 0, inSource: true, inTranslation: true });
  });

  it('is case insensitive', () => {
    const lines = [makeLine({ sourceText: 'Hello World' })];
    const matches = computeMatches(lines, 'hello');
    expect(matches).toHaveLength(1);
  });

  it('handles regex special characters safely', () => {
    const lines = [makeLine({ sourceText: 'foo.bar' })];
    const matches = computeMatches(lines, '.');
    expect(matches).toHaveLength(1);
  });
});

describe('dedupMatches', () => {
  it('deduplicates child match into parent when parent translation matches term', () => {
    const lines = [
      makeLine({
        lineNumber: 1,
        sourceText: 'parent line',
        nodes: [{ indent: 0, spans: [{ text: 'parent line node' }] }],
        translationRowSpan: 2,
      }),
      makeLine({
        lineNumber: 2,
        sourceText: 'child line',
      }),
    ];
    const matches: SearchMatch[] = [
      { lineIndex: 0, inSource: true, inTranslation: false },
      { lineIndex: 1, inSource: true, inTranslation: false },
    ];
    const result = dedupMatches(lines, matches, 'line');
    expect(result).toHaveLength(1);
    expect(result[0].lineIndex).toBe(0);
  });

  it('keeps matches on different lines separate', () => {
    const lines = [
      makeLine({ lineNumber: 1, sourceText: 'first match' }),
      makeLine({ lineNumber: 2, sourceText: 'second match' }),
    ];
    const matches: SearchMatch[] = [
      { lineIndex: 0, inSource: true, inTranslation: false },
      { lineIndex: 1, inSource: true, inTranslation: false },
    ];
    const result = dedupMatches(lines, matches, 'match');
    expect(result).toHaveLength(2);
  });
});

describe('parentIndices', () => {
  it('marks lines within rowSpan as children', () => {
    const lines = [
      makeLine({ lineNumber: 1, translationRowSpan: 3 }),
      makeLine({ lineNumber: 2 }),
      makeLine({ lineNumber: 3 }),
      makeLine({ lineNumber: 4 }),
    ];
    const result = parentIndices(lines);
    expect(result).toEqual([null, 0, 0, null]);
  });

  it('returns null for all when no rowSpans', () => {
    const lines = [
      makeLine({ lineNumber: 1 }),
      makeLine({ lineNumber: 2 }),
    ];
    const result = parentIndices(lines);
    expect(result).toEqual([null, null]);
  });
});

describe('CodeTable rendering', () => {
  const SOURCE = `import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return <button>{count}</button>;
}
`;

  beforeEach(() => {
    (window as any).electronAPI = {
      getNodeDetail: async () => ({ sections: [] }),
      onMenuLoadFolder: () => () => {},
    };
  });

  it('renders a table with rows for each source line', () => {
    const { viewModel } = buildFileData(SOURCE, 'Counter.tsx');
    render(<CodeTable viewModel={viewModel} fileName="Counter.tsx" />);
    const grid = document.querySelector('[class*="w-full font-mono"]');
    expect(grid).toBeTruthy();
    const rows = grid?.querySelectorAll('[data-line]');
    expect(rows?.length).toBeGreaterThan(0);
  });

  it('displays the filename in the header', () => {
    const { viewModel } = buildFileData(SOURCE, 'Counter.tsx');
    render(<CodeTable viewModel={viewModel} fileName="Counter.tsx" />);
    expect(screen.getByText('Counter.tsx')).toBeTruthy();
  });

  it('renders line numbers for each row', () => {
    const { viewModel } = buildFileData(SOURCE, 'Counter.tsx');
    render(<CodeTable viewModel={viewModel} fileName="Counter.tsx" />);
    const line1 = document.querySelector('[data-line="1"]');
    expect(line1).toBeTruthy();
  });

  it('applies bucket classes to rows', () => {
    const { viewModel } = buildFileData(SOURCE, 'Counter.tsx');
    render(<CodeTable viewModel={viewModel} fileName="Counter.tsx" />);
    const rows = document.querySelectorAll('[data-bucket]');
    expect(rows.length).toBeGreaterThan(0);
  });
});
