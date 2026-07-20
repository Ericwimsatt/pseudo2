import { test, expect, type Page } from '@playwright/test';
import { buildFileData } from '../src/lib/buildFileData';
import type { TooltipData } from '../src/lib/renderable/types';

const SOURCE = `import { useState } from 'react';

export function Demo() {
  const count = 0;
  const doubled = count * 2;
  return (
    <div>{doubled}</div>
  );
}
`;

test.describe('enrichment hover', () => {
  test('shows loading then enrichment data on hover', async ({ page }) => {
    const { viewModel } = buildFileData(SOURCE, 'Demo.tsx');
    const serializable = { viewModel };

    await page.addInitScript((data: any) => {
      localStorage.setItem('repoPath', '/tmp/enrich');
      const tree = [{ name: 'Demo.tsx', path: 'Demo.tsx', type: 'file' as const }];
      const sourceLines = data.viewModel.lines.map((l: any) => ({ lineNumber: l.lineNumber, text: l.sourceText }));
      (window as any).electronAPI = {
        loadProject: async ({ path: _path }: { path: string }) => ({ tree, path: '/tmp/enrich' }),
        getTree: async () => ({ tree }),
        loadFileSource: async ({ path: _path }: { path: string }) => ({ path: 'Demo.tsx', lines: sourceLines }),
        loadFileTranslation: async ({ path: _path }: { path: string }) => data,
        getNodeDetail: async ({ query }: { query: any }) => {
          if (query.refPos > 0) {
            const answer: TooltipData = {
              sections: [
                { type: 'definition', line: 6, snippet: [
                  { lineNumber: 5, sourceText: 'export function Demo() {', nodes: data.viewModel.lines[4]?.nodes ?? [] },
                  { lineNumber: 6, sourceText: '  const count = 0;', nodes: data.viewModel.lines[5]?.nodes ?? [] },
                  { lineNumber: 7, sourceText: '  const doubled = count * 2;', nodes: data.viewModel.lines[6]?.nodes ?? [] },
                  { lineNumber: 8, sourceText: '  return (', nodes: data.viewModel.lines[7]?.nodes ?? [] },
                ]},
                { type: 'references', items: [
                  { line: 7, filePath: 'Demo.tsx', snippet: [
                    { lineNumber: 6, sourceText: '  const count = 0;', nodes: data.viewModel.lines[5]?.nodes ?? [] },
                    { lineNumber: 7, sourceText: '  const doubled = count * 2;', nodes: data.viewModel.lines[6]?.nodes ?? [] },
                    { lineNumber: 8, sourceText: '  return (', nodes: data.viewModel.lines[7]?.nodes ?? [] },
                    { lineNumber: 9, sourceText: '    <div>{doubled}</div>', nodes: data.viewModel.lines[8]?.nodes ?? [] },
                  ]},
                ]},
                { type: 'type', text: 'number' },
              ],
            };
            return answer;
          }
          return { sections: [] };
        },
        browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
        uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: '/tmp/enrich' }),
        openDirectorySelector: async () => null,
        onMenuLoadFolder: () => () => {},
      };
    }, serializable);

    await page.goto('http://localhost:5174/#/file/Demo.tsx');

    // Wait for the variable declaration to render
    await expect(page.locator('body')).toContainText('Declare variable');

    // The span with "count" in the translation should have cursor-help if hasHover is set
    const countSpan = page.locator('span.cursor-help').filter({ hasText: 'count' }).first();
    await expect(countSpan).toBeVisible();

    // Hover to trigger enrichment IPC call
    await countSpan.hover();

    // Wait for the hover popover to appear
    const popover = page.locator('.fixed.z-50');
    await expect(popover).toBeVisible({ timeout: 3000 });

    // The popover should contain the enrichment data from our mock
    await expect(popover).toContainText('Definition (line 6)', { timeout: 3000 });
    await expect(popover).toContainText('References');

    await page.screenshot({ path: 'test/screenshots/enrichment-hover.png', fullPage: true });
  });
});
