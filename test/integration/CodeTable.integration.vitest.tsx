import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildFileData } from '../../src/main/translationService/buildFileData';
import type { LineRenderable } from '../../src/main/translationService/renderable/types';
import CodeTable, { computeMatches } from '../../src/App/components/CodeTable';

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
    boxFragment: null,
    ...overrides,
  };
}

describe('computeMatches', () => {
  it('finds match in source text', () => {
    const lines = [makeLine({ sourceText: 'hello world' })];
    const matches = computeMatches(lines, 'hello');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ lineIndex: 0, inSource: true, inTranslation: false });
  });

  it('finds match in translation text via boxFragment', () => {
    const lines = [makeLine({
      sourceText: 'foo',
      boxFragment: {
        layers: [],
        contentNode: { indent: 0, spans: [{ text: 'bar translation' }], children: [], sourceStartLine: 1, sourceEndLine: 1, bucket: 'standard' },
      },
    })];
    const matches = computeMatches(lines, 'translation');
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ lineIndex: 0, inSource: false, inTranslation: true });
  });

  it('finds match in both source and translation', () => {
    const lines = [makeLine({
      sourceText: 'hello world',
      boxFragment: {
        layers: [],
        contentNode: { indent: 0, spans: [{ text: 'hello again' }], children: [], sourceStartLine: 1, sourceEndLine: 1, bucket: 'standard' },
      },
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

  it('uses real parameter names from same-file function definition', () => {
    const source = `function add(a: number, b: number) {
  return a + b;
}
const result = add(3, 4);
`;
    const { viewModel } = buildFileData(source, 'test.ts');
    render(<CodeTable viewModel={viewModel} fileName="test.ts" />);
    const body = document.body.textContent!;
    expect(body).toContain('`a` = 3');
    expect(body).toContain('`b` = 4');
  });

  it('uses real parameter names for built-in functions', () => {
    const source = `const id = setTimeout(handler, 100);\n`;
    const { viewModel } = buildFileData(source, 'test.ts');
    render(<CodeTable viewModel={viewModel} fileName="test.ts" />);
    const body = document.body.textContent!;
    expect(body).toContain('`handler` =');
    expect(body).toContain('`timeout` = 100');
  });

  it('falls back to param_X for unresolvable function calls', () => {
    const source = `foo(a, b);\n`;
    const { viewModel } = buildFileData(source, 'test.ts');
    render(<CodeTable viewModel={viewModel} fileName="test.ts" />);
    const body = document.body.textContent!;
    expect(body).toContain('`param_1` = a');
    expect(body).toContain('`param_2` = b');
  });
});
