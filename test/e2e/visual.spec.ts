import { test, expect } from '@playwright/test';
import { loadFixtureRepo, injectFixture } from '../fixtures/base';
import type { FixtureData } from '../fixtures/loadFixture';
import { templatePrefix } from '../fixtures/phrasingRules';

// Derived from config/phrasing-rules.json so wording edits don't churn these regression tests.
const FN_PREFIX = templatePrefix('function-definition').trim();
const TYPE_PREFIX = templatePrefix('interface').trim();
const IF_PREFIX = templatePrefix('if').trim();
const CLASS_PREFIX = templatePrefix('class').trim();

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
    await expect(page.locator('body')).toContainText(FN_PREFIX);
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
    await expect(page.locator('body')).toContainText(TYPE_PREFIX);
    await expect(page).toHaveScreenshot('interfaces.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('ControlFlow.tsx @visual @regression', async ({ page }) => {
    await loadFile(page, 'ControlFlow.tsx');
    await expect(page.locator('body')).toContainText(IF_PREFIX);
    await expect(page).toHaveScreenshot('control-flow.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Classes.ts @visual @regression', async ({ page }) => {
    await loadFile(page, 'Classes.ts');
    await expect(page.locator('body')).toContainText(CLASS_PREFIX);
    await expect(page).toHaveScreenshot('classes.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
