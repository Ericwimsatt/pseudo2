import { test, expect } from '@playwright/test';
import { loadFixtureRepo, injectFixture } from '../fixtures/base';
import type { FixtureData } from '../fixtures/loadFixture';

let fixture: FixtureData;

test.beforeAll(async () => {
  fixture = await loadFixtureRepo('language-features');
});

test.describe('visual regression @visual @regression', () => {
  async function loadFile(page: import('@playwright/test').Page, fileName: string) {
    await injectFixture(page, fixture, fileName);
    await page.goto('/');
    await page.getByText(fileName, { exact: false }).first().click();
    await expect(page.locator('body')).toContainText(fileName, { timeout: 5000 });
  }

  test('Functions.tsx @visual @smoke', async ({ page }) => {
    await loadFile(page, 'Functions.tsx');
    await expect(page.locator('body')).toContainText('Function');
    await expect(page).toHaveScreenshot('functions.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('JSXElements.tsx @visual @critical', async ({ page }) => {
    await loadFile(page, 'JSXElements.tsx');
    await expect(page.locator('body')).toContainText('<div');
    await expect(page).toHaveScreenshot('jsx-elements.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Interfaces.ts @visual @critical', async ({ page }) => {
    await loadFile(page, 'Interfaces.ts');
    await expect(page.locator('body')).toContainText('Type');
    await expect(page).toHaveScreenshot('interfaces.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('ControlFlow.tsx @visual @regression', async ({ page }) => {
    await loadFile(page, 'ControlFlow.tsx');
    await expect(page.locator('body')).toContainText('If');
    await expect(page).toHaveScreenshot('control-flow.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Classes.ts @visual @regression', async ({ page }) => {
    await loadFile(page, 'Classes.ts');
    await expect(page.locator('body')).toContainText('Class');
    await expect(page).toHaveScreenshot('classes.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
