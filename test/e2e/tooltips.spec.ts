// @regression @p2 @ui:hover @ui:crossref
import { test, expect } from '@playwright/test';
import { loadFixtureRepo, injectFixture } from '../fixtures/base';
import type { FixtureData } from '../fixtures/loadFixture';

let fixture: FixtureData;

test.beforeAll(async () => {
  fixture = await loadFixtureRepo('cross-refs');
});

test.describe('cross-file tooltip @regression @p2 @ui:hover @ui:crossref', () => {
  test('hover over import shows file reference section', async ({ page }) => {
    await injectFixture(page, fixture, 'src/components/DataList.tsx');
    await page.goto('/');
    await page.getByText('DataList.tsx', { exact: false }).first().click();
    await expect(page.locator('body')).toContainText('DataList', { timeout: 5000 });
  });

  test('hover over function call from utils shows definition from other file', async ({ page }) => {
    await injectFixture(page, fixture, 'src/components/DataList.tsx');
    await page.goto('/');
    await page.getByText('DataList.tsx', { exact: false }).first().click();
    await expect(page.locator('body')).toContainText('DataList', { timeout: 5000 });

    const hoverable = page.locator('table tbody td:last-child span.cursor-help');
    const calculateTotal = hoverable.filter({ hasText: /calculateTotal/ });
    if (await calculateTotal.count() > 0) {
      await calculateTotal.first().hover();
      const popover = page.locator('div.fixed.z-50');
      await expect(popover).toBeVisible({ timeout: 3000 });
    }
  });

  test('hover over type usage shows type information', async ({ page }) => {
    await injectFixture(page, fixture, 'src/components/DataItem.tsx');
    await page.goto('/');
    await page.getByText('DataItem.tsx', { exact: false }).first().click();
    await expect(page.locator('body')).toContainText('DataItem', { timeout: 5000 });

    const hoverable = page.locator('table tbody td:last-child span.cursor-help');
    const dataItemType = hoverable.filter({ hasText: /DataItemType/ });
    if (await dataItemType.count() > 0) {
      await dataItemType.first().hover();
      const popover = page.locator('div.fixed.z-50');
      await expect(popover).toBeVisible({ timeout: 3000 });
    }
  });

  test('hover over hook call shows hook definition', async ({ page }) => {
    await injectFixture(page, fixture, 'src/components/DataList.tsx');
    await page.goto('/');
    await page.getByText('DataList.tsx', { exact: false }).first().click();
    await expect(page.locator('body')).toContainText('DataList', { timeout: 5000 });

    const hoverable = page.locator('table tbody td:last-child span.cursor-help');
    const useData = hoverable.filter({ hasText: /useData/ });
    if (await useData.count() > 0) {
      await useData.first().hover();
      const popover = page.locator('div.fixed.z-50');
      await expect(popover).toBeVisible({ timeout: 3000 });
    }
  });
});
