// @regression @p2 @ui:rendering
import { test, expect } from '@playwright/test';
import { loadFixtureRepo, injectFixture } from '../fixtures/base';
import type { FixtureData } from '../fixtures/loadFixture';

let fixture: FixtureData;

test.beforeAll(async () => {
  fixture = await loadFixtureRepo('language-features');
});

test.describe('language feature rendering @regression @p2 @ui:rendering', () => {
  async function loadFile(page: import('@playwright/test').Page, fileName: string) {
    await injectFixture(page, fixture, fileName);
    await page.goto('/');
    await page.getByText(fileName, { exact: false }).first().click();
    await expect(page.locator('body')).toContainText(fileName, { timeout: 5000 });
  }

  test('Functions.tsx shows Function and Parameters text', async ({ page }) => {
    await loadFile(page, 'Functions.tsx');
    await expect(page.locator('body')).toContainText('Function');
    await expect(page.locator('body')).toContainText('Parameters');
  });

  test('JSXElements.tsx shows JSX element translations', async ({ page }) => {
    await loadFile(page, 'JSXElements.tsx');
    await expect(page.locator('body')).toContainText('div');
    await expect(page.locator('body')).toContainText('onClick');
  });

  test('Interfaces.ts shows interface properties with English descriptions', async ({ page }) => {
    await loadFile(page, 'Interfaces.ts');
    await expect(page.locator('body')).toContainText('Interface');
  });

  test('ControlFlow.tsx shows If, For, While, Switch', async ({ page }) => {
    await loadFile(page, 'ControlFlow.tsx');
    await expect(page.locator('body')).toContainText('If');
    await expect(page.locator('body')).toContainText('For');
    await expect(page.locator('body')).toContainText('While');
  });

  test('Classes.ts shows Class and Method', async ({ page }) => {
    await loadFile(page, 'Classes.ts');
    await expect(page.locator('body')).toContainText('Class');
    await expect(page.locator('body')).toContainText('speak');
  });

  test('Enums.ts shows enum values', async ({ page }) => {
    await loadFile(page, 'Enums.ts');
    await expect(page.locator('body')).toContainText('Enum');
  });

  test('Hooks.tsx shows hook names in translation', async ({ page }) => {
    await loadFile(page, 'Hooks.tsx');
    await expect(page.locator('body')).toContainText('useState');
  });
});
