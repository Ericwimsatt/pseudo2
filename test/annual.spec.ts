import { test, expect, type Page } from '@playwright/test';
import { buildFileData } from '../src/lib/buildFileData';

const SOURCE = `function AnnualSummary() {
  const years = useMemo(() => {
    const s = new Set(expenses.map(e => e.expense_date.slice(0, 4)));
    const arr = Array.from(s).sort().reverse();
    if (!arr.length) arr.push(String(new Date().getFullYear()));
    return arr;
  }, [expenses]);
  return years;
}
`;

// Pre-compute the semantic graph in node, exactly as the main process would.
function buildFileDataForTest() {
  const result = buildFileData(SOURCE, 'AnnualSummary.tsx');
  return { viewModel: result.viewModel, path: result.path };
}

async function loadAppWithFile(page: Page) {
  const { viewModel, path: filePath } = buildFileDataForTest();
  const sourceLines = viewModel.lines.map((l) => ({ lineNumber: l.lineNumber, text: l.sourceText }));
  await page.addInitScript((data) => {
    localStorage.setItem('repoPath', '/tmp/annual');
    const tree = [{ name: 'AnnualSummary.tsx', path: 'AnnualSummary.tsx', type: 'file' as const }];
    (window as any).electronAPI = {
      loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: '/tmp/annual' }),
      getTree: async () => ({ tree }),
      loadFileSource: async ({ path: _p }: { path: string }) => ({ path: 'AnnualSummary.tsx', lines: data.sourceLines }),
      loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: data.filePath }),
      browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
      uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/annual' }),
      openDirectorySelector: async () => null,
      onMenuLoadFolder: () => () => {},
    };
  }, { viewModel, sourceLines, filePath });
  await page.goto('http://localhost:5174/');
}

// Collect the rendered translation strings for a given source line number.
async function translationTextsForLine(page: Page, lineNumber: number): Promise<string[]> {
  const row = page.locator('tr', { has: page.locator('td', { hasText: String(lineNumber) }).first() });
  // The translation cell contains divs per node; each div's text is one node's rendered line.
  const cells = row.locator('td').last();
  const texts = await cells.locator('div > div').allTextContents();
  return texts.map((t) => t.trim()).filter(Boolean);
}

test.describe('AnnualSummary translation', () => {
  test('renders a nested graph without duplicating lines', async ({ page }) => {
    await loadAppWithFile(page);

    // Select the file in the sidebar.
    await page.getByText('AnnualSummary.tsx', { exact: false }).first().click();
    // Wait for the function-definition line to render.
    await expect(page.locator('body')).toContainText('Function AnnualSummary');

    // Line 2 should hold the years/useMemo/anonymous-function nodes (nested, no duplication).
    const line2 = await translationTextsForLine(page, 2);
    expect(line2.some((t) => t.includes('Declare variable') && t.includes('years'))).toBeTruthy();
    expect(line2.some((t) => t.includes('Call') && t.includes('useMemo'))).toBeTruthy();
    expect(line2.some((t) => t.includes('Function anonymous'))).toBeTruthy();
    // No exact duplicate strings on line 2.
    const dupes = line2.filter((t, i) => line2.indexOf(t) !== i);
    expect(dupes).toEqual([]);

    // The arrow body now shows up nested on lines 3-6.
    const line3 = await translationTextsForLine(page, 3);
    expect(line3.some((t) => t.includes('Declare variable') && t.includes('s'))).toBeTruthy();
    expect(line3.some((t) => t.includes('Instantiate') && t.includes('Set'))).toBeTruthy();

    const line5 = await translationTextsForLine(page, 5);
    expect(line5.some((t) => t.includes('If') && t.includes('arr.length'))).toBeTruthy();
    // The previously-dropped if-body call is now captured.
    expect(line5.some((t) => t.includes('Call') && t.includes('arr.push'))).toBeTruthy();

    const line6 = await translationTextsForLine(page, 6);
    expect(line6.some((t) => t.includes('return') && t.includes('arr'))).toBeTruthy();

    // Line 8 return years appears exactly once (was duplicated before the fix).
    const line8 = await translationTextsForLine(page, 8);
    const returnYears = line8.filter((t) => t.includes('return') && t.includes('years'));
    expect(returnYears.length).toBe(1);

    // Indentation increases down the tree: line-2 "Define function anonymous" is
    // more indented than "Declare variable years".
    const nodeDivs = page.locator('table tbody td:last-child > div > div');
    const line2indent = await nodeDivs
      .filter({ hasText: /Function anonymous/ })
      .first()
      .evaluate((el) => parseInt(getComputedStyle(el).paddingLeft || '0', 10));
    const yearsIndent = await nodeDivs
      .filter({ hasText: /Declare variable.*years/ })
      .first()
      .evaluate((el) => parseInt(getComputedStyle(el).paddingLeft || '0', 10));
    expect(line2indent).toBeGreaterThan(yearsIndent);

    await page.screenshot({ path: 'test/screenshots/annual-summary.png', fullPage: true });
  });

  test('does not dump multi-line source into a single translation cell', async ({ page }) => {
    await loadAppWithFile(page);
    await page.getByText('AnnualSummary.tsx', { exact: false }).first().click();
    await expect(page.locator('body')).toContainText('Instantiate Set');

    // No rendered translation node may contain a newline character — that is the
    // signature of the old pipeline dumping a multi-line source span verbatim.
    // (Single-line argument summaries are fine.)
    const cellTexts = await page.locator('table tbody td:last-child div > div').allTextContents();
    expect(cellTexts.length).toBeGreaterThan(0);
    for (const t of cellTexts) {
      expect(t).not.toContain('\n');
    }
  });

  test('JSX return is not duplicated (regression for the double-emit bug)', async ({ page }) => {
    const jsxSource = `function App() {
  return (
    <div>
      <span>Hello</span>
    </div>
  );
}
`;
    const fileData = {
      viewModel: buildFileData(jsxSource, 'App.tsx').viewModel,
      path: 'App.tsx',
    };
    const srcLines = fileData.viewModel.lines.map((l: any) => ({ lineNumber: l.lineNumber, text: l.sourceText }));
    await page.addInitScript((data) => {
      localStorage.setItem('repoPath', '/tmp/annual');
      const tree = [{ name: 'App.tsx', path: 'App.tsx', type: 'file' as const }];
      (window as any).electronAPI = {
        loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: '/tmp/annual' }),
        getTree: async () => ({ tree }),
        loadFileSource: async ({ path: _p }: { path: string }) => ({ path: 'App.tsx', lines: data.sourceLines }),
        loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: 'App.tsx' }),
        browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
        uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/annual' }),
        openDirectorySelector: async () => null,
        onMenuLoadFolder: () => () => {},
      };
    }, { viewModel: fileData.viewModel, sourceLines: srcLines });
    await page.goto('http://localhost:5174/');
    await page.getByText('App.tsx', { exact: false }).first().click();
    await expect(page.locator('body')).toContainText('Return Visual Elements:');

    // The "Render" line and each JSX element should appear exactly once on their
    // source line (the old pipeline emitted the return subtree twice).
    const renderTexts = await translationTextsForLine(page, 2);
    expect(renderTexts.filter((t) => t.includes('Return Visual Elements')).length).toBe(1);
    const spanTexts = await translationTextsForLine(page, 4);
    expect(spanTexts.filter((t) => t.includes('<span>')).length).toBe(1);
  });

  test('interface properties are translated to plain English', async ({ page }) => {
    const source = `import type { Expense } from './types';

interface Props {
  expenses: Expense[];
  onExportYear: (year: string) => void;
  isPaid?: boolean;
  limit?: number;
  label: string;
  items: Array<Expense>;
}
`;
    const vmProps = buildFileData(source, 'Props.tsx').viewModel;
    const srcLinesProps = vmProps.lines.map((l: any) => ({ lineNumber: l.lineNumber, text: l.sourceText }));
    await page.addInitScript((data) => {
      localStorage.setItem('repoPath', '/tmp/annual');
      const tree = [{ name: 'Props.tsx', path: 'Props.tsx', type: 'file' as const }];
      (window as any).electronAPI = {
        loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: '/tmp/annual' }),
        getTree: async () => ({ tree }),
        loadFileSource: async ({ path: _p }: { path: string }) => ({ path: 'Props.tsx', lines: data.sourceLines }),
        loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: 'Props.tsx' }),
        browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
        uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/annual' }),
        openDirectorySelector: async () => null,
        onMenuLoadFolder: () => () => {},
      };
    }, { viewModel: vmProps, sourceLines: srcLinesProps });
    await page.goto('http://localhost:5174/');
    await page.getByText('Props.tsx', { exact: false }).first().click();

    await expect(page.locator('body')).toContainText('Interface');

    const allTexts = await page.locator('table tbody td:last-child div > div').allTextContents();
    const joined = allTexts.join('\n');

    expect(joined).toContain('Interface Props');
    expect(joined).toContain('list of');
    expect(joined).toContain('a function that expects');
    expect(joined).toContain('returns nothing');
    expect(joined).toContain("'true' or 'false'");
    expect(joined).toContain('text');
  });

  test('arrow function with parenthesized JSX body renders the body', async ({ page }) => {
    const filterBarSrc = `const FilterBar = ({
  period,
  onPeriodChange,
  comparePeriod,
}: FilterBarProps) => (
  <div className="flex">
    <Select value={period} onValueChange={v => onPeriodChange(v)}>
      <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
    </Select>
  </div>
);
`;
    const vmFilter = buildFileData(filterBarSrc, 'FilterBar.tsx').viewModel;
    const srcLinesFilter = vmFilter.lines.map((l: any) => ({ lineNumber: l.lineNumber, text: l.sourceText }));
    await page.addInitScript((data) => {
      localStorage.setItem('repoPath', '/tmp/annual');
      const tree = [{ name: 'FilterBar.tsx', path: 'FilterBar.tsx', type: 'file' as const }];
      (window as any).electronAPI = {
        loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: '/tmp/annual' }),
        getTree: async () => ({ tree }),
        loadFileSource: async ({ path: _p }: { path: string }) => ({ path: 'FilterBar.tsx', lines: data.sourceLines }),
        loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: 'FilterBar.tsx' }),
        browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
        uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/annual' }),
        openDirectorySelector: async () => null,
        onMenuLoadFolder: () => () => {},
      };
    }, { viewModel: vmFilter, sourceLines: srcLinesFilter });
    await page.goto('http://localhost:5174/');
    await page.getByText('FilterBar.tsx', { exact: false }).first().click();

    // The function definition is present, with single-line destructured params.
    await expect(page.locator('body')).toContainText('Function FilterBar');
    const defText = await page
      .locator('table tbody td:last-child div > div')
      .filter({ hasText: /Function FilterBar/ })
      .first()
      .textContent();
    expect(defText).not.toContain('\n');
    expect(defText).toContain('{ period, onPeriodChange, comparePeriod }');

    // The JSX body now renders (was entirely missing before the fix).
    await expect(page.locator('body')).toContainText('Return Visual Elements:');
    await expect(page.locator('body')).toContainText('<Select');
    await expect(page.locator('body')).toContainText('<SelectTrigger');

    // No rendered translation node contains a newline (no multi-line dumps).
    const cellTexts = await page.locator('table tbody td:last-child div > div').allTextContents();
    for (const t of cellTexts) {
      expect(t).not.toContain('\n');
    }
  });
});
