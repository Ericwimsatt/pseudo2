# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: annual.spec.ts >> AnnualSummary translation >> arrow function with parenthesized JSX body renders the body
- Location: test/annual.spec.ts:203:3

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('body')
Timeout: 5000ms
- Expected substring  - 1
+ Received string     + 6

- Define function FilterBar
+
+     FilesFilterBar.tsxFilterBar.tsx1const FilterBar = ({FilterBar. Parameters: { period, onPeriodChange, comparePeriod }2  period,3  onPeriodChange,4  comparePeriod,5}: FilterBarProps) => (Render6  <div className="flex"><div className=""flex"">7    <Select value={period} onValueChange={v => onPeriodChange(v)}>8      <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>9    </Select>10  </div>11);12 
+     
+   
+
+

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('body')
    - locator resolved to <body>…</body>
    - unexpected value "
    FilesFilterBar.tsxLoading...
    
  

"
    13 × locator resolved to <body>…</body>
       - unexpected value "
    FilesFilterBar.tsxFilterBar.tsx1const FilterBar = ({FilterBar. Parameters: { period, onPeriodChange, comparePeriod }2  period,3  onPeriodChange,4  comparePeriod,5}: FilterBarProps) => (Render6  <div className="flex"><div className=""flex"">7    <Select value={period} onValueChange={v => onPeriodChange(v)}>8      <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>9    </Select>10  </div>11);12 
    
  

"

```

```yaml
- heading "Files" [level=2]
- button "Collapse sidebar":
  - img
- button "FilterBar.tsx"
- heading "FilterBar.tsx" [level=3]
- table:
  - rowgroup:
    - 'row "1 const FilterBar = ({ FilterBar. Parameters: { period, onPeriodChange, comparePeriod }"':
      - cell
      - cell "1"
      - 'cell "const FilterBar = ({"'
      - cell
      - 'cell "FilterBar. Parameters: { period, onPeriodChange, comparePeriod }"'
    - row "2 period,":
      - cell
      - cell "2"
      - cell "period,"
      - cell
    - row "3 onPeriodChange,":
      - cell
      - cell "3"
      - cell "onPeriodChange,"
      - cell
    - row "4 comparePeriod,":
      - cell
      - cell "4"
      - cell "comparePeriod,"
      - cell
    - 'row "5 }: FilterBarProps) => ( Render"':
      - cell
      - cell "5"
      - 'cell "}: FilterBarProps) => ("'
      - cell
      - cell "Render"
    - row "6 <div className=\"flex\"> <div className=\"\"flex\"\">":
      - cell
      - cell "6"
      - cell "<div className=\"flex\">"
      - cell
      - cell "<div className=\"\"flex\"\">"
    - 'row "7 <Select value={period} onValueChange={v => onPeriodChange(v)}>"':
      - cell
      - cell "7"
      - 'cell "<Select value={period} onValueChange={v => onPeriodChange(v)}>"'
      - cell
    - row "8 <SelectTrigger className=\"w-[160px]\"><SelectValue /></SelectTrigger>":
      - cell
      - cell "8"
      - cell "<SelectTrigger className=\"w-[160px]\"><SelectValue /></SelectTrigger>"
      - cell
    - row "9 </Select>":
      - cell
      - cell "9"
      - cell "</Select>"
      - cell
    - row "10 </div>":
      - cell
      - cell "10"
      - cell "</div>"
      - cell
    - row "11 );":
      - cell
      - cell "11"
      - cell ");"
      - cell
    - row "12":
      - cell
      - cell "12"
      - cell
      - cell
```

# Test source

```ts
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
> 237 |     await expect(page.locator('body')).toContainText('Define function FilterBar');
      |                                        ^ Error: expect(locator).toContainText(expected) failed
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
  255 |     }
  256 |   });
  257 | });
  258 | 
```