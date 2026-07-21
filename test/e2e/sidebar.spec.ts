// @regression @p2 @ui:sidebar
import { test, expect } from '@playwright/test';
import { loadFixtureRepo, injectFixture } from '../fixtures/base';
import type { FixtureData } from '../fixtures/loadFixture';

let fixture: FixtureData;

test.beforeAll(async () => {
  fixture = await loadFixtureRepo('cross-refs');
});

test.describe('sidebar navigation @regression @p2 @ui:sidebar', () => {
  async function loadApp(page: import('@playwright/test').Page) {
    await injectFixture(page, fixture);
    await page.goto('/');
    await expect(page.locator('body')).toContainText('Files');
  }

  test('sidebar shows directory tree with expandable folders', async ({ page }) => {
    await loadApp(page);
    await expect(page.getByText('src')).toBeVisible();
    await expect(page.getByText('types.ts')).toBeVisible();
  });

  test('clicking a directory expands its children', async ({ page }) => {
    await loadApp(page);

    // The src directory - clicking toggles its children
    const srcDir = page.getByText('src').first();
    await srcDir.click();
    await page.waitForTimeout(300);

    const hooks = page.getByText('hooks');
    const components = page.getByText('components');
    await expect(hooks).toBeVisible();
    await expect(components).toBeVisible();
  });

  test('clicking a file loads it in the main view', async ({ page }) => {
    await loadApp(page);

    await page.getByText('types.ts').click();
    await expect(page.locator('body')).toContainText('types.ts', { timeout: 5000 });
  });

  test('active file is highlighted in the sidebar', async ({ page }) => {
    await loadApp(page);

    await page.getByText('types.ts').click();
    await page.waitForTimeout(500);
    const activeBtn = page.locator('button.bg-blue-100');
    await expect(activeBtn).toBeVisible();
  });

  test('sidebar collapse button toggles to narrow bar', async ({ page }) => {
    await loadApp(page);

    const collapseBtn = page.locator('button[title="Collapse sidebar"]');
    await expect(collapseBtn).toBeVisible();
    await collapseBtn.click();
    await page.waitForTimeout(300);
    const expandBtn = page.locator('button[title="Expand sidebar"]');
    await expect(expandBtn).toBeVisible();
  });
});
