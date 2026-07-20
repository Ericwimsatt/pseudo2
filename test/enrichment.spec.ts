import { test, expect, type Page } from '@playwright/test';
import { buildFileData } from '../src/lib/buildFileData';

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
          if (query.kind === 'definition' && query.refPos > 0) return { kind: 'definition', data: { line: 4, text: 'count = 0' } };
          if (query.kind === 'references' && query.refPos > 0) return { kind: 'references', data: { list: [{ line: 5, isWrite: false }, { line: 7, isWrite: false }] } };
          if (query.kind === 'type' && query.refPos > 0) return { kind: 'type', data: { text: 'number' } };
          return { kind: query.kind, data: null };
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

    // The span with "count" in the translation should have cursor-help if refPos is set
    const countSpan = page.locator('span.cursor-help').filter({ hasText: 'count' }).first();
    await expect(countSpan).toBeVisible();

    // Hover to trigger enrichment IPC call
    await countSpan.hover();

    // Wait for the hover popover to appear
    const popover = page.locator('.fixed.z-50');
    await expect(popover).toBeVisible({ timeout: 3000 });

    // The popover should contain the enrichment data from our mock
    await expect(popover).toContainText('Defined at line 4', { timeout: 3000 });

    await page.screenshot({ path: 'test/screenshots/enrichment-hover.png', fullPage: true });
  });
});
