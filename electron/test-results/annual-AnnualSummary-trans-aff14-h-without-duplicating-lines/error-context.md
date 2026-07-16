# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: annual.spec.ts >> AnnualSummary translation >> renders a nested graph without duplicating lines
- Location: test/annual.spec.ts:53:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('body')
Timeout: 5000ms
- Expected substring  - 1
+ Received string     + 6

- Define function AnnualSummary
+
+     FilesAnnualSummary.tsxAnnualSummary.tsx1function AnnualSummary() {AnnualSummary. No parameters2  const years = useMemo(() => {years = Call useMemo with [expenses] and 1 functionanonymous. No parameters3    const s = new Set(expenses.map(e => e.expense_date.slice(0, 4)));s = Instantiate Set with expenses.map(e => e.expense_date.slice(0, 4))4    const arr = Array.from(s).sort().reverse();arr = Call Array.from(s).sort().reverse5    if (!arr.length) arr.push(String(new Date().getFullYear()));If !arr.lengthCall arr.push with String(new Date().getFullYear())6    return arr;return `arr`7  }, [expenses]);8  return years;return `years`9}10 
+     
+   
+
+

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('body')
    14 × locator resolved to <body>…</body>
       - unexpected value "
    FilesAnnualSummary.tsxAnnualSummary.tsx1function AnnualSummary() {AnnualSummary. No parameters2  const years = useMemo(() => {years = Call useMemo with [expenses] and 1 functionanonymous. No parameters3    const s = new Set(expenses.map(e => e.expense_date.slice(0, 4)));s = Instantiate Set with expenses.map(e => e.expense_date.slice(0, 4))4    const arr = Array.from(s).sort().reverse();arr = Call Array.from(s).sort().reverse5    if (!arr.length) arr.push(String(new Date().getFullYear()));If !arr.lengthCall arr.push with String(new Date().getFullYear())6    return arr;return `arr`7  }, [expenses]);8  return years;return `years`9}10 
    
  

"

```

```yaml
- heading "Files" [level=2]
- button "Collapse sidebar":
  - img
- button "AnnualSummary.tsx"
- heading "AnnualSummary.tsx" [level=3]
- table:
  - rowgroup:
    - 'row "1 function AnnualSummary() { AnnualSummary. No parameters"':
      - cell
      - cell "1"
      - 'cell "function AnnualSummary() {"'
      - cell
      - cell "AnnualSummary. No parameters"
    - 'row "2 const years = useMemo(() => { years = Call useMemo with [expenses] and 1 function anonymous. No parameters"':
      - cell
      - cell "2"
      - 'cell "const years = useMemo(() => {"'
      - cell
      - cell "years = Call useMemo with [expenses] and 1 function anonymous. No parameters"
    - row "3 const s = new Set(expenses.map(e => e.expense_date.slice(0, 4))); s = Instantiate Set with expenses.map(e => e.expense_date.slice(0, 4))":
      - cell
      - cell "3"
      - cell "const s = new Set(expenses.map(e => e.expense_date.slice(0, 4)));"
      - cell
      - cell "s = Instantiate Set with expenses.map(e => e.expense_date.slice(0, 4))"
    - row "4 const arr = Array.from(s).sort().reverse(); arr = Call Array.from(s).sort().reverse":
      - cell
      - cell "4"
      - cell "const arr = Array.from(s).sort().reverse();"
      - cell
      - cell "arr = Call Array.from(s).sort().reverse"
    - row "5 if (!arr.length) arr.push(String(new Date().getFullYear())); If !arr.length Call arr.push with String(new Date().getFullYear())":
      - cell
      - cell "5"
      - cell "if (!arr.length) arr.push(String(new Date().getFullYear()));"
      - cell
      - cell "If !arr.length Call arr.push with String(new Date().getFullYear())"
    - 'row "6 return arr; return `arr`"':
      - cell
      - cell "6"
      - cell "return arr;"
      - cell
      - 'cell "return `arr`"'
    - 'row "7 }, [expenses]);"':
      - cell
      - cell "7"
      - 'cell "}, [expenses]);"'
      - cell
    - 'row "8 return years; return `years`"':
      - cell
      - cell "8"
      - cell "return years;"
      - cell
      - 'cell "return `years`"'
    - 'row "9 }"':
      - cell
      - cell "9"
      - 'cell "}"'
      - cell
    - row "10":
      - cell
      - cell "10"
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
  6   | const SOURCE = `function AnnualSummary() {
  7   |   const years = useMemo(() => {
  8   |     const s = new Set(expenses.map(e => e.expense_date.slice(0, 4)));
  9   |     const arr = Array.from(s).sort().reverse();
  10  |     if (!arr.length) arr.push(String(new Date().getFullYear()));
  11  |     return arr;
  12  |   }, [expenses]);
  13  |   return years;
  14  | }
  15  | `;
  16  | 
  17  | // Pre-compute the semantic graph in node, exactly as the main process would.
  18  | function buildFileData() {
  19  |   const ast = makeAST(SOURCE, 'AnnualSummary.tsx');
  20  |   const semanticNodes = makeSemanticGraph(ast);
  21  |   const viewModel = buildViewModel(semanticNodes, SOURCE);
  22  |   return { viewModel, path: 'AnnualSummary.tsx' };
  23  | }
  24  | 
  25  | async function loadAppWithFile(page: Page) {
  26  |   const fileData = buildFileData();
  27  |   await page.addInitScript((data) => {
  28  |     localStorage.setItem('repoPath', '/tmp/annual');
  29  |     const tree = [{ name: 'AnnualSummary.tsx', path: 'AnnualSummary.tsx', type: 'file' as const }];
  30  |     (window as any).electronAPI = {
  31  |       loadRepo: async () => ({ tree, path: '/tmp/annual' }),
  32  |       getTree: async () => ({ tree }),
  33  |       getFile: async () => data,
  34  |       browseDirectory: async () => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
  35  |       uploadFolder: async () => ({ tree, path: '/tmp/annual' }),
  36  |       dialogOpenDirectory: async () => null,
  37  |       onMenuLoadFolder: () => () => {},
  38  |     };
  39  |   }, fileData);
  40  |   await page.goto('http://localhost:5174/');
  41  | }
  42  | 
  43  | // Collect the rendered translation strings for a given source line number.
  44  | async function translationTextsForLine(page: Page, lineNumber: number): Promise<string[]> {
  45  |   const row = page.locator('tr', { has: page.locator('td', { hasText: String(lineNumber) }).first() });
  46  |   // The translation cell contains divs per node; each div's text is one node's rendered line.
  47  |   const cells = row.locator('td').last();
  48  |   const texts = await cells.locator('div > div').allTextContents();
  49  |   return texts.map((t) => t.trim()).filter(Boolean);
  50  | }
  51  | 
  52  | test.describe('AnnualSummary translation', () => {
  53  |   test('renders a nested graph without duplicating lines', async ({ page }) => {
  54  |     await loadAppWithFile(page);
  55  | 
  56  |     // Select the file in the sidebar.
  57  |     await page.getByText('AnnualSummary.tsx', { exact: false }).first().click();
  58  |     // Wait for the function-definition line to render.
> 59  |     await expect(page.locator('body')).toContainText('Define function AnnualSummary');
      |                                        ^ Error: expect(locator).toContainText(expected) failed
  60  | 
  61  |     // Line 2 should hold the years/useMemo/anonymous-function nodes (nested, no duplication).
  62  |     const line2 = await translationTextsForLine(page, 2);
  63  |     expect(line2.some((t) => t.includes('Declare variable') && t.includes('years'))).toBeTruthy();
  64  |     expect(line2.some((t) => t.includes('Call') && t.includes('useMemo'))).toBeTruthy();
  65  |     expect(line2.some((t) => t.includes('Define function anonymous'))).toBeTruthy();
  66  |     // No exact duplicate strings on line 2.
  67  |     const dupes = line2.filter((t, i) => line2.indexOf(t) !== i);
  68  |     expect(dupes).toEqual([]);
  69  | 
  70  |     // The arrow body now shows up nested on lines 3-6.
  71  |     const line3 = await translationTextsForLine(page, 3);
  72  |     expect(line3.some((t) => t.includes('Declare variable') && t.includes('s'))).toBeTruthy();
  73  |     expect(line3.some((t) => t.includes('Instantiate') && t.includes('Set'))).toBeTruthy();
  74  | 
  75  |     const line5 = await translationTextsForLine(page, 5);
  76  |     expect(line5.some((t) => t.includes('If') && t.includes('arr.length'))).toBeTruthy();
  77  |     // The previously-dropped if-body call is now captured.
  78  |     expect(line5.some((t) => t.includes('Call') && t.includes('arr.push'))).toBeTruthy();
  79  | 
  80  |     const line6 = await translationTextsForLine(page, 6);
  81  |     expect(line6.some((t) => t.includes('return') && t.includes('arr'))).toBeTruthy();
  82  | 
  83  |     // Line 8 return years appears exactly once (was duplicated before the fix).
  84  |     const line8 = await translationTextsForLine(page, 8);
  85  |     const returnYears = line8.filter((t) => t.includes('return') && t.includes('years'));
  86  |     expect(returnYears.length).toBe(1);
  87  | 
  88  |     // Indentation increases down the tree: line-2 "Define function anonymous" is
  89  |     // more indented than "Declare variable years".
  90  |     const nodeDivs = page.locator('table tbody td:last-child > div > div');
  91  |     const line2indent = await nodeDivs
  92  |       .filter({ hasText: /Define function anonymous/ })
  93  |       .first()
  94  |       .evaluate((el) => parseInt(getComputedStyle(el).paddingLeft || '0', 10));
  95  |     const yearsIndent = await nodeDivs
  96  |       .filter({ hasText: /Declare variable.*years/ })
  97  |       .first()
  98  |       .evaluate((el) => parseInt(getComputedStyle(el).paddingLeft || '0', 10));
  99  |     expect(line2indent).toBeGreaterThan(yearsIndent);
  100 | 
  101 |     await page.screenshot({ path: 'test/screenshots/annual-summary.png', fullPage: true });
  102 |   });
  103 | 
  104 |   test('does not dump multi-line source into a single translation cell', async ({ page }) => {
  105 |     await loadAppWithFile(page);
  106 |     await page.getByText('AnnualSummary.tsx', { exact: false }).first().click();
  107 |     await expect(page.locator('body')).toContainText('Instantiate Set');
  108 | 
  109 |     // No rendered translation node may contain a newline character — that is the
  110 |     // signature of the old pipeline dumping a multi-line source span verbatim.
  111 |     // (Single-line argument summaries are fine.)
  112 |     const cellTexts = await page.locator('table tbody td:last-child div > div').allTextContents();
  113 |     expect(cellTexts.length).toBeGreaterThan(0);
  114 |     for (const t of cellTexts) {
  115 |       expect(t).not.toContain('\n');
  116 |     }
  117 |   });
  118 | 
  119 |   test('JSX return is not duplicated (regression for the double-emit bug)', async ({ page }) => {
  120 |     const jsxSource = `function App() {
  121 |   return (
  122 |     <div>
  123 |       <span>Hello</span>
  124 |     </div>
  125 |   );
  126 | }
  127 | `;
  128 |     const fileData = {
  129 |       viewModel: buildViewModel(makeSemanticGraph(makeAST(jsxSource, 'App.tsx')), jsxSource),
  130 |       path: 'App.tsx',
  131 |     };
  132 |     await page.addInitScript((data) => {
  133 |       localStorage.setItem('repoPath', '/tmp/annual');
  134 |       const tree = [{ name: 'App.tsx', path: 'App.tsx', type: 'file' as const }];
  135 |       (window as any).electronAPI = {
  136 |         loadRepo: async () => ({ tree, path: '/tmp/annual' }),
  137 |         getTree: async () => ({ tree }),
  138 |         getFile: async () => data,
  139 |         browseDirectory: async () => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
  140 |         uploadFolder: async () => ({ tree, path: '/tmp/annual' }),
  141 |         dialogOpenDirectory: async () => null,
  142 |         onMenuLoadFolder: () => () => {},
  143 |       };
  144 |     }, fileData);
  145 |     await page.goto('http://localhost:5174/');
  146 |     await page.getByText('App.tsx', { exact: false }).first().click();
  147 |     await expect(page.locator('body')).toContainText('Render');
  148 | 
  149 |     // The "Render" line and each JSX element should appear exactly once on their
  150 |     // source line (the old pipeline emitted the return subtree twice).
  151 |     const renderTexts = await translationTextsForLine(page, 2);
  152 |     expect(renderTexts.filter((t) => t.includes('Render')).length).toBe(1);
  153 |     const spanTexts = await translationTextsForLine(page, 4);
  154 |     expect(spanTexts.filter((t) => t.includes('<span>')).length).toBe(1);
  155 |   });
  156 | 
  157 |   test('interface properties are translated to plain English', async ({ page }) => {
  158 |     const source = `import type { Expense } from './types';
  159 | 
```