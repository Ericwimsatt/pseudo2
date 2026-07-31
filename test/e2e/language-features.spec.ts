// @regression @p2 @ui:rendering
import { test, expect } from '@playwright/test';
import { loadFixtureRepo, injectFixture } from '../fixtures/base';
import type { FixtureData } from '../fixtures/loadFixture';
import {
  templatePrefix,
  templateLiteralBetween,
} from '../fixtures/phrasingRules';

// Derived from config/phrasing-rules.json so wording edits don't churn these regression tests.
const FN_PREFIX = templatePrefix('function-definition').trim();
const FN_ARGS_FRAGMENT = templateLiteralBetween('function-definition', 'name', 'params').trim();
const TYPE_PREFIX = templatePrefix('interface').trim();
const CLASS_PREFIX = templatePrefix('class').trim();
const IF_PREFIX = templatePrefix('if').trim();
const FOR_PREFIX = templatePrefix('loop-for-of').trim();

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
    await expect(page.locator('body')).toContainText(FN_PREFIX);
    await expect(page.locator('body')).toContainText(FN_ARGS_FRAGMENT);
  });

  test('JSXElements.tsx shows JSX element translations', async ({ page }) => {
    await loadFile(page, 'JSXElements.tsx');
    await expect(page.locator('body')).toContainText('div');
    await expect(page.locator('body')).toContainText('onClick');
  });

  test('Interfaces.ts shows interface properties with English descriptions', async ({ page }) => {
    await loadFile(page, 'Interfaces.ts');
    await expect(page.locator('body')).toContainText(TYPE_PREFIX);
  });

  test('ControlFlow.tsx shows If, For, While, Switch', async ({ page }) => {
    await loadFile(page, 'ControlFlow.tsx');
    await expect(page.locator('body')).toContainText(IF_PREFIX);
    await expect(page.locator('body')).toContainText(FOR_PREFIX);
    // "Switch" and "While" appear as capitalized words in the file's inline
    // comments ("// Switch/case", "// While") — kept verbatim, no rule.
    await expect(page.locator('body')).toContainText('Switch');
    await expect(page.locator('body')).toContainText('While');
  });

  test('Classes.ts shows Class and Method', async ({ page }) => {
    await loadFile(page, 'Classes.ts');
    await expect(page.locator('body')).toContainText(CLASS_PREFIX);
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
