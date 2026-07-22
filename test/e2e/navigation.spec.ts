// @critical @p1 @ui:search @ui:navigation
import { test, expect, type Page } from '@playwright/test';
import { buildFileData } from '../../src/main/translationService/buildFileData';

const SOURCE = `import { useState } from 'react';
import { formatCount } from './helper';

export function Demo() {
  const [count, setCount] = useState(0);
  return (
    <div className="flex items-center gap-2">
      <a href="https://example.com/docs">Docs</a>
    </div>
  );
}
`;

async function loadApp(page: Page, extraHash?: string) {
  const viewModel = buildFileData(SOURCE, 'Demo.tsx').viewModel;
  const sourceLines = viewModel.lines.map((l) => ({ lineNumber: l.lineNumber, text: l.sourceText }));
  await page.addInitScript((data) => {
    const tree = [{ name: 'Demo.tsx', path: 'Demo.tsx', type: 'file' as const }];
    (window as any).electronAPI = {
      loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: '/tmp/demo' }),
      getTree: async () => ({ tree }),
      loadFileSource: async ({ path: _p }: { path: string }) => ({ path: 'Demo.tsx', lines: data.sourceLines }),
      loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: 'Demo.tsx' }),
      browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
      uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/demo' }),
      openDirectorySelector: async () => null,
      getLastProjectPath: async () => '/tmp/demo',
      setLastProjectPath: async (_path: string) => {},
      clearLastProjectPath: async () => {},
      onMenuLoadFolder: () => () => {},
    };
  }, { viewModel, sourceLines });
  await page.goto(`http://localhost:5174/${extraHash || ''}`);

  // If we already navigated via hash URL, just wait for the file to load.
  // Otherwise, select the file from the sidebar.
  if (!extraHash) {
    await page.getByText('Demo.tsx', { exact: false }).first().click();
  }
  await expect(page.locator('body')).toContainText('Function Demo');
}

test.describe('Ctrl+F search @critical @p1 @ui:search @ui:navigation', () => {
  test('Cmd+F opens search bar and typing shows match count', async ({ page }) => {
    await loadApp(page);
    await page.keyboard.press('Meta+f');
    const searchInput = page.locator('input[placeholder="Find in file..."]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('function');
    // Should find matches (source has "Function" in translation, "function" in source)
    await expect(page.locator('text=1/')).toBeVisible();
  });

  test('search highlights source text matches', async ({ page }) => {
    await loadApp(page);
    await page.keyboard.press('Meta+f');
    const searchInput = page.locator('input[placeholder="Find in file..."]');
    await searchInput.fill('useState');

    // Source column contains "useState" — should be wrapped in <mark>
    const marks = page.locator('mark');
    await expect(marks.first()).toBeVisible();
    const markText = await marks.first().textContent();
    expect(markText).toBe('useState');
  });

  test('search highlights translation text matches', async ({ page }) => {
    await loadApp(page);
    await page.keyboard.press('Meta+f');
    const searchInput = page.locator('input[placeholder="Find in file..."]');
    await searchInput.fill('Demo');

    // Translation column mentions "Function Demo" — mark should appear there
    const marks = page.locator('mark');
    await expect(marks.first()).toBeVisible();
  });

  test('Enter navigates between matches', async ({ page }) => {
    await loadApp(page);
    await page.keyboard.press('Meta+f');
    const searchInput = page.locator('input[placeholder="Find in file..."]');
    await searchInput.fill('count');

    // Initial: shows match count like "1/2"
    await expect(page.getByText(/\d+\/\d+/)).toBeVisible();

    // Press Enter to go to next match
    await searchInput.press('Enter');
    // Should cycle — either 2/2 or wrap to 1/2 depending on match count
    await expect(page.getByText(/\d+\/\d+/)).toBeVisible();
  });

  test('Escape closes search bar', async ({ page }) => {
    await loadApp(page);
    await page.keyboard.press('Meta+f');
    await expect(page.locator('input[placeholder="Find in file..."]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('input[placeholder="Find in file..."]')).not.toBeVisible();
  });

  test('Close button dismisses search bar', async ({ page }) => {
    await loadApp(page);
    await page.keyboard.press('Meta+f');
    await expect(page.locator('input[placeholder="Find in file..."]')).toBeVisible();
    await page.locator('button', { hasText: '\u2715' }).click();
    await expect(page.locator('input[placeholder="Find in file..."]')).not.toBeVisible();
  });

  test('screenshot of search highlights', async ({ page }) => {
    await loadApp(page);
    await page.keyboard.press('Meta+f');
    const searchInput = page.locator('input[placeholder="Find in file..."]');
    await searchInput.fill('return');
    // Wait for marks to render
    await expect(page.locator('mark').first()).toBeVisible();
    await page.screenshot({ path: 'test/screenshots/search-highlights.png', fullPage: true });
  });
});

test.describe('URL query param navigation', () => {
  test('sourceLine param scrolls to the target line', async ({ page }) => {
    // Navigate directly to Demo.tsx with sourceLine=8
    await loadApp(page, '#/file/Demo.tsx?sourceLine=8');
    // Line 8 is "return (" — wait for the row to be in view
    const line8 = page.locator('[data-line="8"]');
    await expect(line8).toBeVisible();
  });

  test('sourceLine param shows brief highlight on the target row', async ({ page }) => {
    await loadApp(page, '#/file/Demo.tsx?sourceLine=3');
    // Line 3 is "export function Demo() {" — the row should have a flash highlight
    const line3 = page.locator('[data-line="3"]');
    await expect(line3).toBeVisible();
  });

  test('transLine param scrolls to the translation for that source line', async ({ page }) => {
    await loadApp(page, '#/file/Demo.tsx?transLine=5');
    // Line 5 is "const [count, setCount] = useState(0);"
    const line5 = page.locator('[data-line="5"]');
    await expect(line5).toBeVisible();
  });

  test('var param highlights and scrolls to variable occurrences', async ({ page }) => {
    await loadApp(page, '#/file/Demo.tsx?var=useState');
    // "useState" appears in source on line 1 and 5
    // The marks should be visible in source text
    const marks = page.locator('mark');
    await expect(marks.first()).toBeVisible();
    // The first mark should contain "useState"
    const markText = await marks.first().textContent();
    expect(markText?.toLowerCase()).toContain('usestate');
  });

  test('var param highlights in translation column', async ({ page }) => {
    await loadApp(page, '#/file/Demo.tsx?var=Demo');
    // Translation column mentions "Function Demo" — marks should appear there
    const marks = page.locator('mark');
    await expect(marks.first()).toBeVisible();
  });

  test('screenshot of URL nav with var param', async ({ page }) => {
    await loadApp(page, '#/file/Demo.tsx?var=count');
    await expect(page.locator('mark').first()).toBeVisible();
    await page.screenshot({ path: 'test/screenshots/url-nav-var.png', fullPage: true });
  });
});

test.describe('filepath URL navigation', () => {
  test('navigating to file URL loads the file', async ({ page }) => {
    await loadApp(page, '#/file/Demo.tsx');
    await expect(page.locator('body')).toContainText('Function Demo');
  });
});

test.describe('rowSpan dedup', () => {
  const MULTI_LINE_PARAMS = `const FilterBar = ({
  period,
  onPeriodChange,
  compareEnabled,
  onCompareEnabledChange,
  comparePeriod,
  onComparePeriodChange,
  customRange,
  onCustomRangeFromChange,
  onCustomRangeToChange,
  periodOptions,
}: FilterBarProps) => (
  <div>
    <Select value={period} onValueChange={v => onPeriodChange(v)} />
  </div>
);
`;

  async function loadMultiLine(page: Page, extraHash?: string) {
    const viewModel = buildFileData(MULTI_LINE_PARAMS, 'FilterBar.tsx').viewModel;
    const sourceLines = viewModel.lines.map((l) => ({ lineNumber: l.lineNumber, text: l.sourceText }));
    await page.addInitScript((data) => {
      const tree = [{ name: 'FilterBar.tsx', path: 'FilterBar.tsx', type: 'file' as const }];
      (window as any).electronAPI = {
        loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: '/tmp/filter' }),
        getTree: async () => ({ tree }),
        loadFileSource: async ({ path: _p }: { path: string }) => ({ path: 'FilterBar.tsx', lines: data.sourceLines }),
        loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: 'FilterBar.tsx' }),
        browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
        uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/filter' }),
        openDirectorySelector: async () => null,
        getLastProjectPath: async () => '/tmp/filter',
        setLastProjectPath: async (_path: string) => {},
        clearLastProjectPath: async () => {},
        onMenuLoadFolder: () => () => {},
      };
    }, { viewModel, sourceLines });
    await page.goto(`http://localhost:5174/${extraHash || ''}`);
    if (!extraHash) {
      await page.getByText('FilterBar.tsx', { exact: false }).first().click();
    }
    await expect(page.locator('body')).toContainText('`FilterBar`');
  }

  test('search for param in multi-line function dedupes spanned source into parent match', async ({ page }) => {
    await loadMultiLine(page);
    await page.keyboard.press('Meta+f');
    const searchInput = page.locator('input[placeholder="Find in file..."]');
    // "compareEnabled" appears in translation on line 1 AND source on line 5
    // (within the rowSpan). No other occurrences. After dedup: 1 match.
    await searchInput.fill('compareEnabled');
    await expect(page.getByText('1/1')).toBeVisible();
  });

  test('search for param in multi-line function highlights source on spanned lines', async ({ page }) => {
    await loadMultiLine(page);
    await page.keyboard.press('Meta+f');
    const searchInput = page.locator('input[placeholder="Find in file..."]');
    // "compareEnabled" on line 5 is within the rowSpan, its source should still be highlighted.
    await searchInput.fill('compareEnabled');

    const line5 = page.locator('[data-line="5"]');
    const marksInLine5 = line5.locator('mark');
    await expect(marksInLine5.first()).toBeVisible();
  });

  test('search for term outside and inside rowSpan counts separate matches', async ({ page }) => {
    await loadMultiLine(page);
    await page.keyboard.press('Meta+f');
    const searchInput = page.locator('input[placeholder="Find in file..."]');
    // "onPeriodChange" appears in translation on line 1, source on line 3 (both within rowSpan),
    // and in JSX on line ~16 (outside rowSpan). Should be 2 matches after dedup.
    await searchInput.fill('onPeriodChange');
    await expect(page.getByText('/2')).toBeVisible();
  });

  test('var= param in multi-line function dedupes match count', async ({ page }) => {
    await loadMultiLine(page, '#/file/FilterBar.tsx?var=compareEnabled');
    const marks = page.locator('mark');
    await expect(marks.first()).toBeVisible();
  });
});
