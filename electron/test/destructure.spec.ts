import { test, expect, type Page } from '@playwright/test';
import { makeSemanticGraph } from '../src/lib/makeSemanticGraph';
import { makeAST } from '../src/lib/makeAST';
import { buildViewModel } from '../src/lib/renderable/viewModel';

async function setupPage(page: Page, source: string, fileName: string) {
  const fileData = {
    viewModel: buildViewModel(makeSemanticGraph(makeAST(source, fileName)), source),
    path: fileName,
  };
  await page.addInitScript((data) => {
    localStorage.setItem('repoPath', '/tmp/test');
    const tree = [{ name: data.path, path: data.path, type: 'file' as const }];
    (window as any).electronAPI = {
      loadRepo: async () => ({ tree, path: '/tmp/test' }),
      getTree: async () => ({ tree }),
      getFile: async () => data,
      browseDirectory: async () => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
      uploadFolder: async () => ({ tree, path: '/tmp/test' }),
      dialogOpenDirectory: async () => null,
      onMenuLoadFolder: () => () => {},
    };
  }, fileData);
  await page.goto('http://localhost:5180/');
  await page.getByText(fileName, { exact: false }).first().click();
}

async function getAllTranslationTexts(page: Page): Promise<string[]> {
  const texts = await page.locator('table tbody td:last-child div > div').allTextContents();
  return texts.map((t) => t.trim()).filter(Boolean);
}

test.describe('destructuring variable declarations', () => {
  test('const [editingId, setEditingId] = useState(null) renders combined', async ({ page }) => {
    const source = `import { useState } from 'react';
function App() {
  const [editingId, setEditingId] = useState<string | null>(null);
  return null;
}
`;
    await setupPage(page, source, 'App.tsx');
    await expect(page.locator('body')).toContainText('Define function App');

    const texts = await getAllTranslationTexts(page);
    const destructuredLine = texts.find((t) => t.includes('editingId') && t.includes('setEditingId'));
    expect(destructuredLine).toBeDefined();
    // Combined: both names on same line with "the result of calling"
    expect(destructuredLine).toContain('editingId and setEditingId = the result of calling useState(null)');
    // Should NOT have two separate lines for variable and call
    const variableOnly = texts.find((t) => t === 'editingId and setEditingId = ');
    expect(variableOnly).toBeUndefined();
    const callOnly = texts.find((t) => t === 'Call useState with null');
    expect(callOnly).toBeUndefined();
  });

  test('const { data, error } = useQuery() renders combined', async ({ page }) => {
    const source = `import { useQuery } from 'react';
function App() {
  const { data, error } = useQuery();
  return null;
}
`;
    await setupPage(page, source, 'App2.tsx');
    await expect(page.locator('body')).toContainText('Define function App');

    const texts = await getAllTranslationTexts(page);
    const destructuredLine = texts.find((t) => t.includes('data') && t.includes('error'));
    expect(destructuredLine).toBeDefined();
    expect(destructuredLine).toContain('data and error = the result of calling useQuery');
  });

  test('const [a, b] = someArray renders combined with literal', async ({ page }) => {
    const source = `function App() {
  const [a, b] = someArray;
  return null;
}
`;
    await setupPage(page, source, 'App3.tsx');
    await expect(page.locator('body')).toContainText('Define function App');

    const texts = await getAllTranslationTexts(page);
    const destructuredLine = texts.find((t) => t.includes('a and b'));
    expect(destructuredLine).toBeDefined();
    expect(destructuredLine).toContain('a and b = someArray');
  });

  test('single variables are unchanged', async ({ page }) => {
    const source = `function App() {
  const years = useMemo(() => []);
  return null;
}
`;
    await setupPage(page, source, 'App4.tsx');
    await expect(page.locator('body')).toContainText('Define function App');

    const texts = await getAllTranslationTexts(page);
    // Single variable still shows "name = " and separate call
    expect(texts.some((t) => t.includes('years ='))).toBeTruthy();
    expect(texts.some((t) => t.includes('Call useMemo'))).toBeTruthy();
  });
});
