# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: destructure.spec.ts >> destructuring variable declarations >> single variables are unchanged
- Location: test/destructure.spec.ts:87:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('body')
Timeout: 5000ms
- Expected substring  - 1
+ Received string     + 6

- Define function App
+
+     FilesApp4.tsxApp4.tsx1function App() {App. No parameters2  const years = useMemo(() => []);years = Call useMemo with () => []3  return null;return `null`4}5 
+     
+   
+
+

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('body')
    14 × locator resolved to <body>…</body>
       - unexpected value "
    FilesApp4.tsxApp4.tsx1function App() {App. No parameters2  const years = useMemo(() => []);years = Call useMemo with () => []3  return null;return `null`4}5 
    
  

"

```

```yaml
- heading "Files" [level=2]
- button "Collapse sidebar":
  - img
- button "App4.tsx"
- heading "App4.tsx" [level=3]
- table:
  - rowgroup:
    - 'row "1 function App() { App. No parameters"':
      - cell
      - cell "1"
      - 'cell "function App() {"'
      - cell
      - cell "App. No parameters"
    - row "2 const years = useMemo(() => []); years = Call useMemo with () => []":
      - cell
      - cell "2"
      - cell "const years = useMemo(() => []);"
      - cell
      - cell "years = Call useMemo with () => []"
    - 'row "3 return null; return `null`"':
      - cell
      - cell "3"
      - cell "return null;"
      - cell
      - 'cell "return `null`"'
    - 'row "4 }"':
      - cell
      - cell "4"
      - 'cell "}"'
      - cell
    - row "5":
      - cell
      - cell "5"
      - cell
      - cell
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import { makeSemanticGraph } from '../src/lib/makeSemanticGraph';
  3   | import { makeAST } from '../src/lib/makeAST';
  4   | import { buildViewModel } from '../src/lib/renderable/viewModel';
  5   | 
  6   | async function setupPage(page: Page, source: string, fileName: string) {
  7   |   const fileData = {
  8   |     viewModel: buildViewModel(makeSemanticGraph(makeAST(source, fileName)), source),
  9   |     path: fileName,
  10  |   };
  11  |   await page.addInitScript((data) => {
  12  |     localStorage.setItem('repoPath', '/tmp/test');
  13  |     const tree = [{ name: data.path, path: data.path, type: 'file' as const }];
  14  |     (window as any).electronAPI = {
  15  |       loadRepo: async () => ({ tree, path: '/tmp/test' }),
  16  |       getTree: async () => ({ tree }),
  17  |       getFile: async () => data,
  18  |       browseDirectory: async () => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
  19  |       uploadFolder: async () => ({ tree, path: '/tmp/test' }),
  20  |       dialogOpenDirectory: async () => null,
  21  |       onMenuLoadFolder: () => () => {},
  22  |     };
  23  |   }, fileData);
  24  |   await page.goto('http://localhost:5180/');
  25  |   await page.getByText(fileName, { exact: false }).first().click();
  26  | }
  27  | 
  28  | async function getAllTranslationTexts(page: Page): Promise<string[]> {
  29  |   const texts = await page.locator('table tbody td:last-child div > div').allTextContents();
  30  |   return texts.map((t) => t.trim()).filter(Boolean);
  31  | }
  32  | 
  33  | test.describe('destructuring variable declarations', () => {
  34  |   test('const [editingId, setEditingId] = useState(null) renders combined', async ({ page }) => {
  35  |     const source = `import { useState } from 'react';
  36  | function App() {
  37  |   const [editingId, setEditingId] = useState<string | null>(null);
  38  |   return null;
  39  | }
  40  | `;
  41  |     await setupPage(page, source, 'App.tsx');
  42  |     await expect(page.locator('body')).toContainText('Define function App');
  43  | 
  44  |     const texts = await getAllTranslationTexts(page);
  45  |     const destructuredLine = texts.find((t) => t.includes('editingId') && t.includes('setEditingId'));
  46  |     expect(destructuredLine).toBeDefined();
  47  |     // Combined: both names on same line with "the result of calling"
  48  |     expect(destructuredLine).toContain('editingId and setEditingId = the result of calling useState(null)');
  49  |     // Should NOT have two separate lines for variable and call
  50  |     const variableOnly = texts.find((t) => t === 'editingId and setEditingId = ');
  51  |     expect(variableOnly).toBeUndefined();
  52  |     const callOnly = texts.find((t) => t === 'Call useState with null');
  53  |     expect(callOnly).toBeUndefined();
  54  |   });
  55  | 
  56  |   test('const { data, error } = useQuery() renders combined', async ({ page }) => {
  57  |     const source = `import { useQuery } from 'react';
  58  | function App() {
  59  |   const { data, error } = useQuery();
  60  |   return null;
  61  | }
  62  | `;
  63  |     await setupPage(page, source, 'App2.tsx');
  64  |     await expect(page.locator('body')).toContainText('Define function App');
  65  | 
  66  |     const texts = await getAllTranslationTexts(page);
  67  |     const destructuredLine = texts.find((t) => t.includes('data') && t.includes('error'));
  68  |     expect(destructuredLine).toBeDefined();
  69  |     expect(destructuredLine).toContain('data and error = the result of calling useQuery');
  70  |   });
  71  | 
  72  |   test('const [a, b] = someArray renders combined with literal', async ({ page }) => {
  73  |     const source = `function App() {
  74  |   const [a, b] = someArray;
  75  |   return null;
  76  | }
  77  | `;
  78  |     await setupPage(page, source, 'App3.tsx');
  79  |     await expect(page.locator('body')).toContainText('Define function App');
  80  | 
  81  |     const texts = await getAllTranslationTexts(page);
  82  |     const destructuredLine = texts.find((t) => t.includes('a and b'));
  83  |     expect(destructuredLine).toBeDefined();
  84  |     expect(destructuredLine).toContain('a and b = someArray');
  85  |   });
  86  | 
  87  |   test('single variables are unchanged', async ({ page }) => {
  88  |     const source = `function App() {
  89  |   const years = useMemo(() => []);
  90  |   return null;
  91  | }
  92  | `;
  93  |     await setupPage(page, source, 'App4.tsx');
> 94  |     await expect(page.locator('body')).toContainText('Define function App');
      |                                        ^ Error: expect(locator).toContainText(expected) failed
  95  | 
  96  |     const texts = await getAllTranslationTexts(page);
  97  |     // Single variable still shows "name = " and separate call
  98  |     expect(texts.some((t) => t.includes('years ='))).toBeTruthy();
  99  |     expect(texts.some((t) => t.includes('Call useMemo'))).toBeTruthy();
  100 |   });
  101 | });
  102 | 
```