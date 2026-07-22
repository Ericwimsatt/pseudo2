// @critical @p1 @ui:hover
import { test, expect, type Page } from '@playwright/test';
import { loadFixtureRepo, injectFixture } from '../fixtures/base';
import type { FixtureData } from '../fixtures/loadFixture';

let fixture: FixtureData;

test.beforeAll(async () => {
  fixture = await loadFixtureRepo('language-features');
});

async function loadApp(page: Page) {
  await injectFixture(page, fixture, 'Hooks.tsx');
  await page.goto('/');
  await page.getByText('Hooks.tsx', { exact: false }).first().click();
  await expect(page.locator('body')).toContainText('Call useState', { timeout: 5000 });
}

// The hoverable spans are the ones StyledSpan marks with cursor-help.
function hoverable(page: Page, text: string | RegExp) {
  return page
    .locator('span.cursor-help')
    .filter({ hasText: text });
}

const popover = (page: Page) => page.locator('div.fixed.z-50');

test.describe('hover popovers @critical @p1 @ui:hover', () => {
  test('hook call shows tooltip popover', async ({ page }) => {
    await loadApp(page);
    await hoverable(page, /^useState$/).first().hover();
    await expect(popover(page)).toBeVisible({ timeout: 3000 });
    await expect(popover(page)).toContainText('useState(initialState)');
  });

  test('import module shows module popover', async ({ page }) => {
    await loadApp(page);
    await hoverable(page, /^react$/).hover();
    await expect(popover(page)).toBeVisible({ timeout: 3000 });
    await expect(popover(page)).toContainText('Module');
  });

  test('popover dismisses after leaving the trigger', async ({ page }) => {
    await loadApp(page);
    await hoverable(page, /^useState$/).first().hover();
    await expect(popover(page)).toBeVisible({ timeout: 3000 });
    await page.locator('span').filter({ hasText: /^Function / }).first().hover();
    await expect(popover(page)).toBeHidden();
  });

  test('hover styles render after interactions', async ({ page }) => {
    await loadApp(page);
    await hoverable(page, /^useState$/).first().hover();
    await expect(popover(page)).toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: 'test/screenshots/hover-popover.png', fullPage: true });
  });
});
