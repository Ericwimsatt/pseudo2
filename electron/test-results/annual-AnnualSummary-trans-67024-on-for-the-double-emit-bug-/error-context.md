# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: annual.spec.ts >> AnnualSummary translation >> JSX return is not duplicated (regression for the double-emit bug)
- Location: test/annual.spec.ts:119:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 0
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Files" [level=2] [ref=e6]
      - button "Collapse sidebar" [ref=e7]:
        - img [ref=e8]
    - button "App.tsx" [active] [ref=e11]
  - generic [ref=e12]:
    - heading "App.tsx" [level=3] [ref=e14]
    - table [ref=e15]:
      - rowgroup [ref=e22]:
        - 'row "1 function App() { App. No parameters" [ref=e23]':
          - cell [ref=e24]
          - cell "1" [ref=e25]
          - 'cell "function App() {" [ref=e26]':
            - generic [ref=e27]: "function App() {"
          - cell [ref=e28]
          - cell "App. No parameters" [ref=e29]:
            - generic [ref=e31]: App. No parameters
        - row "2 return ( Render" [ref=e32]:
          - cell [ref=e33]
          - cell "2" [ref=e34]
          - cell "return (" [ref=e35]:
            - generic [ref=e36]: return (
          - cell [ref=e37]
          - cell "Render" [ref=e38]:
            - generic [ref=e40]: Render
        - row "3 <div> <div>" [ref=e41]:
          - cell [ref=e42]
          - cell "3" [ref=e43]
          - cell "<div>" [ref=e44]:
            - generic [ref=e45]: <div>
          - cell [ref=e46]
          - cell "<div>" [ref=e47]:
            - generic [ref=e49]: <div>
        - row "4 <span>Hello</span>" [ref=e50]:
          - cell [ref=e51]
          - cell "4" [ref=e52]
          - cell "<span>Hello</span>" [ref=e53]:
            - generic [ref=e54]: <span>Hello</span>
          - cell [ref=e55]
        - row "5 </div>" [ref=e56]:
          - cell [ref=e57]
          - cell "5" [ref=e58]
          - cell "</div>" [ref=e59]:
            - generic [ref=e60]: </div>
          - cell [ref=e61]
        - row "6 );" [ref=e62]:
          - cell [ref=e63]
          - cell "6" [ref=e64]
          - cell ");" [ref=e65]:
            - generic [ref=e66]: );
          - cell [ref=e67]
        - 'row "7 }" [ref=e68]':
          - cell [ref=e69]
          - cell "7" [ref=e70]
          - 'cell "}" [ref=e71]':
            - generic [ref=e72]: "}"
          - cell [ref=e73]
        - row "8" [ref=e74]:
          - cell [ref=e75]
          - cell "8" [ref=e76]
          - cell [ref=e77]
          - cell [ref=e79]
```

# Test source

```ts
  54  |     await loadAppWithFile(page);
  55  | 
  56  |     // Select the file in the sidebar.
  57  |     await page.getByText('AnnualSummary.tsx', { exact: false }).first().click();
  58  |     // Wait for the function-definition line to render.
  59  |     await expect(page.locator('body')).toContainText('Define function AnnualSummary');
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
> 154 |     expect(spanTexts.filter((t) => t.includes('<span>')).length).toBe(1);
      |                                                                  ^ Error: expect(received).toBe(expected) // Object.is equality
  155 |   });
  156 | 
  157 |   test('interface properties are translated to plain English', async ({ page }) => {
  158 |     const source = `import type { Expense } from './types';
  159 | 
  160 | interface Props {
  161 |   expenses: Expense[];
  162 |   onExportYear: (year: string) => void;
  163 |   isPaid?: boolean;
  164 |   limit?: number;
  165 |   label: string;
  166 |   items: Array<Expense>;
  167 | }
  168 | `;
  169 |     const fileData = {
  170 |       viewModel: buildViewModel(makeSemanticGraph(makeAST(source, 'Props.tsx')), source),
  171 |       path: 'Props.tsx',
  172 |     };
  173 |     await page.addInitScript((data) => {
  174 |       localStorage.setItem('repoPath', '/tmp/annual');
  175 |       const tree = [{ name: 'Props.tsx', path: 'Props.tsx', type: 'file' as const }];
  176 |       (window as any).electronAPI = {
  177 |         loadRepo: async () => ({ tree, path: '/tmp/annual' }),
  178 |         getTree: async () => ({ tree }),
  179 |         getFile: async () => data,
  180 |         browseDirectory: async () => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
  181 |         uploadFolder: async () => ({ tree, path: '/tmp/annual' }),
  182 |         dialogOpenDirectory: async () => null,
  183 |         onMenuLoadFolder: () => () => {},
  184 |       };
  185 |     }, fileData);
  186 |     await page.goto('http://localhost:5174/');
  187 |     await page.getByText('Props.tsx', { exact: false }).first().click();
  188 | 
  189 |     await expect(page.locator('body')).toContainText('Define interface');
  190 | 
  191 |     const allTexts = await page.locator('table tbody td:last-child div > div').allTextContents();
  192 |     const joined = allTexts.join('\n');
  193 | 
  194 |     expect(joined).toContain('Define interface Props');
  195 |     expect(joined).toContain('list of');
  196 |     expect(joined).toContain('a function that expects parameters');
  197 |     expect(joined).toContain('returns nothing');
  198 |     expect(joined).toContain("optional,");
  199 |     expect(joined).toContain("'true' or 'false'");
  200 |     expect(joined).toContain('text');
  201 |   });
  202 | 
  203 |   test('arrow function with parenthesized JSX body renders the body', async ({ page }) => {
  204 |     const filterBarSrc = `const FilterBar = ({
  205 |   period,
  206 |   onPeriodChange,
  207 |   comparePeriod,
  208 | }: FilterBarProps) => (
  209 |   <div className="flex">
  210 |     <Select value={period} onValueChange={v => onPeriodChange(v)}>
  211 |       <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
  212 |     </Select>
  213 |   </div>
  214 | );
  215 | `;
  216 |     const fileData = {
  217 |       viewModel: buildViewModel(makeSemanticGraph(makeAST(filterBarSrc, 'FilterBar.tsx')), filterBarSrc),
  218 |       path: 'FilterBar.tsx',
  219 |     };
  220 |     await page.addInitScript((data) => {
  221 |       localStorage.setItem('repoPath', '/tmp/annual');
  222 |       const tree = [{ name: 'FilterBar.tsx', path: 'FilterBar.tsx', type: 'file' as const }];
  223 |       (window as any).electronAPI = {
  224 |         loadRepo: async () => ({ tree, path: '/tmp/annual' }),
  225 |         getTree: async () => ({ tree }),
  226 |         getFile: async () => data,
  227 |         browseDirectory: async () => ({ currentPath: '/tmp', parentPath: null, directories: [] }),
  228 |         uploadFolder: async () => ({ tree, path: '/tmp/annual' }),
  229 |         dialogOpenDirectory: async () => null,
  230 |         onMenuLoadFolder: () => () => {},
  231 |       };
  232 |     }, fileData);
  233 |     await page.goto('http://localhost:5174/');
  234 |     await page.getByText('FilterBar.tsx', { exact: false }).first().click();
  235 | 
  236 |     // The function definition is present, with single-line destructured params.
  237 |     await expect(page.locator('body')).toContainText('Define function FilterBar');
  238 |     const defText = await page
  239 |       .locator('table tbody td:last-child div > div')
  240 |       .filter({ hasText: /Define function FilterBar/ })
  241 |       .first()
  242 |       .textContent();
  243 |     expect(defText).not.toContain('\n');
  244 |     expect(defText).toContain('{ period, onPeriodChange, comparePeriod }');
  245 | 
  246 |     // The JSX body now renders (was entirely missing before the fix).
  247 |     await expect(page.locator('body')).toContainText('Render');
  248 |     await expect(page.locator('body')).toContainText('<Select');
  249 |     await expect(page.locator('body')).toContainText('<SelectTrigger');
  250 | 
  251 |     // No rendered translation node contains a newline (no multi-line dumps).
  252 |     const cellTexts = await page.locator('table tbody td:last-child div > div').allTextContents();
  253 |     for (const t of cellTexts) {
  254 |       expect(t).not.toContain('\n');
```