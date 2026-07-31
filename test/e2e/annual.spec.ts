// @smoke @p0 @core:translation
import { test, expect, type Page } from '@playwright/test';
import { buildFileData } from '../../src/main/translationService/buildFileData';
import {
  templatePrefix,
  renderTemplate,
  templateLiteralBetween,
} from '../fixtures/phrasingRules';

// Derived from config/phrasing-rules.json so wording edits don't churn
// these tests.
const FN_PREFIX = templatePrefix('function-definition').trim();
const FN_ARROW = templatePrefix('function-definition').trim();
const CALL_PREFIX = templatePrefix('call-function').trim();
const RETURN_JSX = renderTemplate('return-jsx', {});
const TYPE_PREFIX = templatePrefix('type-alias').trim();
const ANON_FN = renderTemplate('function-definition-anonymous', {});

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
    const tree = [{ name: 'AnnualSummary.tsx', path: 'AnnualSummary.tsx', type: 'file' as const }];
    (window as any).electronAPI = {
      loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: '/tmp/annual' }),
      getTree: async () => ({ tree }),
      loadFileSource: async ({ path: _p }: { path: string }) => ({ path: 'AnnualSummary.tsx', lines: data.sourceLines }),
      loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: data.filePath }),
      browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
      uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/annual' }),
      openDirectorySelector: async () => null,
      getLastProjectPath: async () => '/tmp/annual',
      setLastProjectPath: async (_path: string) => {},
      clearLastProjectPath: async () => {},
      onMenuLoadFolder: () => () => {},
    };
  }, { viewModel, sourceLines, filePath });
  await page.goto('http://localhost:5174/');
}

// Collect the rendered translation strings for a given source line number.
async function translationTextsForLine(page: Page, lineNumber: number): Promise<string[]> {
  return page.evaluate((ln) => {
    const sourceCell = document.querySelector(`[data-line="${ln}"]`);
    if (!sourceCell) return [];
    const sourceStyle = sourceCell.getAttribute('style') || '';
    const rowMatch = sourceStyle.match(/grid-area:\s*(\d+)/);
    if (!rowMatch) return [];
    const rowNum = rowMatch[1];
    const allDivs = document.querySelectorAll<HTMLDivElement>('div');
    let transCell: HTMLDivElement | null = null;
    for (const div of allDivs) {
      const s = div.getAttribute('style') || '';
      if (s.startsWith(`grid-area: ${rowNum} / 6`)) {
        transCell = div;
        break;
      }
    }
    if (!transCell) return [];
    return transCell.innerText.split('\n').map(t => t.trim()).filter(Boolean);
  }, lineNumber);
}

test.describe('AnnualSummary translation @smoke @p0 @core:translation', () => {
  test('renders a nested graph without duplicating lines', async ({ page }) => {
    await loadAppWithFile(page);

    // Select the file in the sidebar.
    await page.getByText('AnnualSummary.tsx', { exact: false }).first().click();
    // Wait for the function-definition line to render.
    await expect(page.locator('body')).toContainText(`${FN_PREFIX} AnnualSummary`);

    // Line 2 should hold the years/useMemo/anonymous-function nodes (nested, no duplication).
    const line2 = await translationTextsForLine(page, 2);
    expect(line2.some((t) => t.includes('years'))).toBeTruthy();
    expect(line2.some((t) => t.includes(CALL_PREFIX) && t.includes('useMemo'))).toBeTruthy();
    expect(line2.some((t) => t.includes(FN_PREFIX))).toBeTruthy();
    // No exact duplicate strings on line 2.
    const dupes = line2.filter((t, i) => line2.indexOf(t) !== i);
    expect(dupes).toEqual([]);

    // Line 3 has the arrow function inside .map().
    const line3 = await translationTextsForLine(page, 3);
    expect(line3.some((t) => t.includes(`${FN_ARROW} anonymous`))).toBeTruthy();
    expect(line3.some((t) => t.includes('return'))).toBeTruthy();

    const line5 = await translationTextsForLine(page, 5);
    expect(line5.some((t) => t.includes(templatePrefix('if').trim()) && t.includes('arr.length'))).toBeTruthy();
    // The previously-dropped if-body call is now captured.
    expect(line5.some((t) => t.includes(CALL_PREFIX) && t.includes('arr.push'))).toBeTruthy();

    const line6 = await translationTextsForLine(page, 6);
    expect(line6.some((t) => t.includes(templatePrefix('return-value').trim()) && t.includes('arr'))).toBeTruthy();

    // Line 8 return years appears exactly once (was duplicated before the fix).
    const line8 = await translationTextsForLine(page, 8);
    const returnYears = line8.filter((t) => t.includes(templatePrefix('return-value').trim()) && t.includes('years'));
    expect(returnYears.length).toBe(1);

    // All nested content on line 2 is flattened into a single cell.
    await expect(page.locator('body')).toContainText(`${CALL_PREFIX} useMemo`);
    await expect(page.locator('body')).toContainText(ANON_FN);

    await page.screenshot({ path: 'test/screenshots/annual-summary.png', fullPage: true });
  });

  test('does not dump multi-line source into a single translation cell', async ({ page }) => {
    await loadAppWithFile(page);
    await page.getByText('AnnualSummary.tsx', { exact: false }).first().click();
    await expect(page.locator('body')).toContainText(`${FN_ARROW} anonymous`);

    // The structured renderer intentionally nests children on the start line of a node.
    // We still must not dump the raw multi-line source span verbatim.
    const cellTexts = await page.locator('[style*="/ 6"] div > div').allTextContents();
    expect(cellTexts.length).toBeGreaterThan(0);
    for (const t of cellTexts) {
      expect(t).not.toContain('useMemo(() => {');
      expect(t).not.toContain('new Set(expenses.map');
      expect(t).not.toContain('String(new Date().getFullYear())');
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
      const tree = [{ name: 'App.tsx', path: 'App.tsx', type: 'file' as const }];
      (window as any).electronAPI = {
        loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: '/tmp/annual' }),
        getTree: async () => ({ tree }),
        loadFileSource: async ({ path: _p }: { path: string }) => ({ path: 'App.tsx', lines: data.sourceLines }),
        loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: 'App.tsx' }),
        browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
        uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/annual' }),
        openDirectorySelector: async () => null,
        getLastProjectPath: async () => '/tmp/annual',
        setLastProjectPath: async (_path: string) => {},
        clearLastProjectPath: async () => {},
        onMenuLoadFolder: () => () => {},
      };
    }, { viewModel: fileData.viewModel, sourceLines: srcLines });
    await page.goto('http://localhost:5174/');
    await page.getByText('App.tsx', { exact: false }).first().click();
    await expect(page.locator('body')).toContainText(RETURN_JSX);

    // The "Render" line and each JSX element should appear exactly once on their
    // source line (the old pipeline emitted the return subtree twice).
    const renderTexts = await translationTextsForLine(page, 2);
    expect(renderTexts.filter((t) => t.includes(RETURN_JSX)).length).toBe(1);
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
      const tree = [{ name: 'Props.tsx', path: 'Props.tsx', type: 'file' as const }];
      (window as any).electronAPI = {
        loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: '/tmp/annual' }),
        getTree: async () => ({ tree }),
        loadFileSource: async ({ path: _p }: { path: string }) => ({ path: 'Props.tsx', lines: data.sourceLines }),
        loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: 'Props.tsx' }),
        browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
        uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/annual' }),
        openDirectorySelector: async () => null,
        getLastProjectPath: async () => '/tmp/annual',
        setLastProjectPath: async (_path: string) => {},
        clearLastProjectPath: async () => {},
        onMenuLoadFolder: () => () => {},
      };
    }, { viewModel: vmProps, sourceLines: srcLinesProps });
    await page.goto('http://localhost:5174/');
    await page.getByText('Props.tsx', { exact: false }).first().click();

    await expect(page.locator('body')).toContainText(TYPE_PREFIX);

    const allTexts = await page.locator('[style*="/ 6"] div > div').allTextContents();
    const joined = allTexts.join('\n');

    expect(joined).toContain(`${TYPE_PREFIX} Props`);
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
      const tree = [{ name: 'FilterBar.tsx', path: 'FilterBar.tsx', type: 'file' as const }];
      (window as any).electronAPI = {
        loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: '/tmp/annual' }),
        getTree: async () => ({ tree }),
        loadFileSource: async ({ path: _p }: { path: string }) => ({ path: 'FilterBar.tsx', lines: data.sourceLines }),
        loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: 'FilterBar.tsx' }),
        browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
        uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/annual' }),
        openDirectorySelector: async () => null,
        getLastProjectPath: async () => '/tmp/annual',
        setLastProjectPath: async (_path: string) => {},
        clearLastProjectPath: async () => {},
        onMenuLoadFolder: () => () => {},
      };
    }, { viewModel: vmFilter, sourceLines: srcLinesFilter });
    await page.goto('http://localhost:5174/');
    await page.getByText('FilterBar.tsx', { exact: false }).first().click();

    // The arrow-function variable is rendered as a function-definition.
    await expect(page.locator('body')).toContainText(`${FN_PREFIX} FilterBar`);
    const defTexts = await page
      .locator('[style*="/ 6"] div > div')
      .allTextContents();
    // Pull the literal segment of function-definition that sits between the
    // name placeholder and the params placeholder ("args: {") from the JSON
    // so editing the rule wording keeps this filter working.
    const fnArgsFragment = templateLiteralBetween('function-definition', 'name', 'params').trim();
    const filtered = defTexts.map(t => t.trim()).filter(t => t.includes(fnArgsFragment));
    expect(filtered.length).toBeGreaterThan(0);
    const defText = filtered[0];
    expect(defText).toContain('{ period, onPeriodChange, comparePeriod }');

    // The JSX body now renders (was entirely missing before the fix).
    await expect(page.locator('body')).toContainText(RETURN_JSX);
    await expect(page.locator('body')).toContainText('<Select');
    await expect(page.locator('body')).toContainText('<SelectTrigger');

    // No rendered translation node contains a raw multi-line source dump.
    const cellTexts = await page.locator('[style*="grid-column: 6"] div > div').allTextContents();
    for (const t of cellTexts) {
      expect(t).not.toContain('onPeriodChange(v)');
      expect(t).not.toContain('className="w-[160px]"');
    }
  });
});
