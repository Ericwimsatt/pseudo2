import { test, expect, type Page } from '@playwright/test';
import { buildFileData } from '../src/lib/buildFileData';

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

async function loadApp(page: Page) {
  const fileData = {
    viewModel: buildFileData(SOURCE, 'Demo.tsx').viewModel,
    path: 'Demo.tsx',
  };
  await page.addInitScript((data) => {
    localStorage.setItem('repoPath', '/tmp/demo');
    const tree = [{ name: 'Demo.tsx', path: 'Demo.tsx', type: 'file' as const }];
    (window as any).electronAPI = {
      loadRepo: async () => ({ tree, path: '/tmp/demo' }),
      getTree: async () => ({ tree }),
      getFile: async () => data,
      browseDirectory: async () => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
      uploadFolder: async () => ({ tree, path: '/tmp/demo' }),
      dialogOpenDirectory: async () => null,
      onMenuLoadFolder: () => () => {},
    };
  }, fileData);
  await page.goto('http://localhost:5174/');
  await page.getByText('Demo.tsx', { exact: false }).first().click();
  await expect(page.locator('body')).toContainText('Define function Demo');
}

// The hoverable spans are the ones StyledSpan marks with cursor-help.
function hoverable(page: Page, text: string | RegExp) {
  return page
    .locator('table tbody td:last-child span.cursor-help')
    .filter({ hasText: text });
}

const popover = (page: Page) => page.locator('div.fixed.z-50');

test.describe('hover popovers', () => {
  test('hook call shows tooltip popover', async ({ page }) => {
    await loadApp(page);
    await hoverable(page, /^useState$/).hover();
    await expect(popover(page)).toBeVisible();
    await expect(popover(page)).toContainText('useState(initialState)');
  });

  test('import module shows module popover', async ({ page }) => {
    await loadApp(page);
    await hoverable(page, './helper').hover();
    await expect(popover(page)).toBeVisible();
    await expect(popover(page)).toContainText('Module');
  });

  test('className value shows className popover', async ({ page }) => {
    await loadApp(page);
    await hoverable(page, 'flex items-center gap-2').hover();
    await expect(popover(page)).toBeVisible();
    await expect(popover(page)).toContainText('className');
  });

  test('popover dismisses after leaving the trigger', async ({ page }) => {
    await loadApp(page);
    await hoverable(page, /^useState$/).hover();
    await expect(popover(page)).toBeVisible();
    await page
      .locator('table tbody td:last-child')
      .getByText('Define function', { exact: false })
      .first()
      .hover();
    await expect(popover(page)).toBeHidden();
  });

  test('hover styles render after interactions', async ({ page }) => {
    await loadApp(page);
    await hoverable(page, /^useState$/).hover();
    await expect(popover(page)).toBeVisible();
    await page.screenshot({ path: 'test/screenshots/hover-popover.png', fullPage: true });
  });
});
