# Phase 2: Core Unit Test Coverage

## Objective
Write Vitest unit tests for the core translation engine and service wrappers. These are the fastest tests (no browser) and give the highest confidence-per-millisecond ratio. After this phase, every pure function in the translation pipeline should have explicit coverage.

## Prerequisites
Phase 1 must be complete — the fixture repo exists, `test/fixtures/loadFixture.ts` and `test/fixtures/base.ts` exist, and the test directory is reorganized.

## Key Architectural Decisions (consistent with other phases)

- All unit tests go in `test/unit/core/` (translation engine) or `test/unit/services/` (I/O wrappers)
- Tests call functions directly with known inputs and assert on known outputs
- No browser, no DOM — pure Node.js Vitest
- Use the fixture repo files as source inputs where appropriate (import the raw file content for `buildFileData` calls)
- Tag smoke tests with `@smoke` in the test name so they can be run via vitest's `--grep` (or use `.only` for development)

## Tasks

### 1. Unit Test `translateType.ts` — `test/unit/core/translateType.vitest.ts`

**File to test:** `src/main/translationService/renderable/translateType.ts`
**Function:** `translateType(typeText: string): string`

**Test every branch:**

| Input | Expected output pattern |
|-------|------------------------|
| `'string'` | `'text'` |
| `'number'` | `'number'` |
| `'boolean'` | `"'true' or 'false'"` |
| `'void'` | `'nothing'` |
| `'never'` | `'never'` |
| `'any'` | `'any'` |
| `'null'` | `'null'` |
| `'undefined'` | `'undefined'` |
| `'true'` | `'true'` |
| `'false'` | `'false'` |
| `'string[]'` | `'list of text'` |
| `'Array<string>'` | `'list of text'` |
| `'ReadonlyArray<string>'` | `'list of text'` |
| `'() => void'` | `'a function that expects nothing'` |
| `'(x: string) => number'` | `'a function that expects ...'` |
| `'string \| number'` | `'text or number'` |
| `'string \| undefined'` | `'text (optional)'` |
| `'"hello" \| "world"'` | `'hello or world'` |
| `'import("./types").MyType'` | `'MyType'` (strip import path) |
| `'keyof T'` | passthrough |
| `'Record<string, number>'` | passthrough or description |

**Edge cases:**
- Empty string
- Very deeply nested generics
- Multiple union levels
- Optional with `?` syntax
- `Promise<T>` — should describe as async
- `T | null` — should mention nullable
- `T | undefined` — should mention optional

### 2. Unit Test `phrasing.ts` — `test/unit/core/phrasing.vitest.ts`

**File to test:** `src/main/translationService/renderable/phrasing.ts`
**Target:** Every function in the `PHRASERS` Record.

**Approach:**
For each phraser type, create a minimal AST node (using `makeSemanticGraph` or hand-crafted `SemanticNode`) and verify the resulting text.

**Minimum coverage:**

| Phraser | Construct to test | Key assertions |
|---------|------------------|----------------|
| `import` | `import { x } from './y'` | Contains "Import", "from" |
| `export` | `export { x }` | Contains "Export" |
| `function-definition` | `function foo() {}` | Contains "Function foo" |
| `function-definition` | `(a: string, b: number) =>` | Parameters listed |
| `function-definition` | `() =>` | "no parameters" |
| `class` | `class Foo {}` | Contains "Class Foo" |
| `class` | `class Foo extends Bar` | Contains "extends" |
| `class` | `class Foo implements Bar` | Contains "implements" |
| `interface` | `interface Foo { }` | Contains "Interface Foo" |
| `interface` with extends | `interface Foo extends Bar` | Contains "extends" |
| `typeAlias` | `type Foo = ...` | Contains "Type Foo as" |
| `property` | `name: string` | Field name present |
| `variable-assignment` | `const x = 42` | Contains "`x` = 42" |
| `variable-assignment` | `const x = foo()` | Contains "`x` =" (with child) |
| `return` | `return x` | Contains "Return x" |
| `return` with JSX | `return (<div>...</div>)` | Contains "Return Visual Elements:" |
| `if` | `if (x) { }` | Contains "If x" |
| `if/else` | `if (x) { } else { }` | Contains "If...otherwise" |
| `loop` | `for (let i = 0; i < n; i++)` | Contains "For i from 0" |
| `loop` | `for (const x of arr)` | Contains "For each x in arr" |
| `loop` | `while (cond)` | Contains "While cond" |
| `call-function` | `foo()` | Contains "Call foo" |
| `call-function` | `obj.method()` | Contains "Call obj.method" |
| `jsx-element` | `<div>` | Element name, opening tag |
| `jsx-element` | `</div>` | Closing tag |
| `jsx-self-closing` | `<br />` | Contains "<br />" |
| `jsx-expression` | `{name}` | Contains "Show: name" |
| `jsx-expression ternary` | `{cond ? a : b}` | Conditional description |
| `jsx-map` | `{items.map(i => ...)}` | Contains "For each i in items" |
| `jsx-attr` | `className="flex"` | Contains "CSS classes: flex" |
| `jsx-attr event` | `onClick={handler}` | Contains "On click" |
| `object-literal` | `{ a: 1, b: 2 }` | Properties listed |
| `method` | `methodName(args) { }` | Contains "Method methodName" |
| fallback | Unknown node | Contains node type name |

**Important:** Test the `useMemo`/`useCallback` closure patterns specifically, since these are common in React and have special handling.

### 3. Unit Test `jsxHandler.ts` — `test/unit/core/jsxHandler.vitest.ts`

**File to test:** `src/main/translationService/jsxHandler.ts` (1200 lines — the largest file)
**Targets:**

**A) `translateSingleClass(className: string): string | null`**
- Tailwind width classes (`w-*`, `h-*`, `max-w-*`, `min-h-*`)
- Tailwind flex classes (`flex`, `flex-col`, `items-center`, `justify-between`, `gap-*`)
- Tailwind spacing (`p-*`, `m-*`, `px-*`, `py-*`, `mt-*`, `mb-*`, `space-x-*`, `space-y-*`)
- Tailwind typography (`text-*`, `font-*`, `leading-*`, `tracking-*`)
- Tailwind colors (`text-red-500`, `bg-blue-200`, `border-gray-300`)
- Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)
- Tailwind state prefixes (`hover:`, `focus:`, `active:`, `disabled:`)
- Tailwind dark mode (`dark:`)
- Tailwind animations/transforms (`animate-spin`, `transition-all`, `hover:scale-105`, `rotate-45`)
- Non-Tailwind classes return `null`
- Empty string returns `null`

**B) `translateClassName(classString: string): string`**
- Single class → single description
- Multiple classes → comma-separated
- Mixed Tailwind + custom → both parts
- Empty string → empty
- Whitespace handling (multiple spaces, leading/trailing)

**C) `describeEventHandler(handlerName: string): string`**
- `onClick` → "click"
- `onChange` → "change"
- `onSubmit` → "submit"
- `onKeyDown` → "key press"
- `onMouseEnter` → "mouse enter"
- `onFocus` → "focus"
- `onBlur` → "blur"
- Unknown → passthrough

**D) `processAttributes(attrs: JsxAttribute[]): DisplayNodeData[]`**
- `className` → CSS class descriptions
- `style={{ ... }}` → style descriptions
- Event handlers → event descriptions
- `href` → link target
- `src` → source
- `alt` → alt text
- `aria-label` → accessibility label
- `disabled`, `readOnly`, `required` → boolean attribute descriptions
- `data-*` → skipped
- `key` → skipped
- `ref` → skipped
- Spread attributes → handled gracefully

**E) JSX expression processing:**
- `processMapCall()` → "For each ... in ..."
- `processFilterCall()` → "Filtered by ..."
- Ternaries in JSX → conditional description
- `&&` expressions → conditional description
- Nested expressions → correct nesting

### 4. Unit Test `makeSemanticGraph.ts` — `test/unit/core/makeSemanticGraph.vitest.ts`

**File to test:** `src/main/translationService/makeSemanticGraph.ts` (625 lines)
**Target:** Test specific AST-to-semantic-graph transformations.

**Approach:** For each construct, call `buildFileData(source, path)` and inspect the resulting ViewModel nodes.

**Coverage gaps to fill (current tests cover: arrow functions, hooks, basic JSX, interfaces, call arguments):**

| Construct | Test source | Key assertions |
|-----------|-------------|----------------|
| Switch statement | `switch(x) { case 1: break; default: }` | Correct node types, case labels |
| Switch with fallthrough | `switch(x) { case 1: case 2: break; }` | Combined cases |
| Class declaration | `class Foo { method() {} }` | Class + method nodes |
| Class with constructor | `class Foo { constructor(x) {} }` | Constructor parameter handling |
| Abstract class | `abstract class Foo { abstract method(): void; }` | Abstract markers |
| Object literal | `const o = { a: 1, b: 2 }` | Object literal node, properties |
| Object literal with methods | `const o = { method() {} }` | Method shorthand |
| Spread in object | `const o = { ...a, b: 2 }` | Spread property |
| Array destructuring | `const [a, b] = arr` | Destructured variable |
| Object destructuring | `const { a, b } = obj` | Destructured variable |
| Default value destructuring | `const { a = 5 } = obj` | Default values |
| for loop | `for (let i = 0; i < n; i++) {}` | Loop variable, condition, increment |
| for-of | `for (const x of arr) {}` | Element variable |
| for-in | `for (const key in obj) {}` | Key variable |
| while | `while (cond) {}` | Condition |
| do-while | `do {} while (cond)` | Condition (post-check) |
| Try/catch | `try {} catch(e) {}` | Try block, catch variable |
| Throw | `throw new Error()` | Throw with expression |
| Export named | `export { foo, bar }` | Export node with names |
| Export default function | `export default function() {}` | Default export |
| Generator | `function* gen() { yield 1; }` | Generator marker |
| Async function | `async function foo() {}` | Async marker |
| Tagged template | `html\`<div>\`` | Template tag handling |
| Optional chaining | `a?.b?.()` | Chain nodes |
| Nullish coalescing | `a ?? b` | Coalescing node |
| Do expression (if handled) | N/A | Skip if not supported |
| getIdentifierPos edge cases | Various | Node position mapping |

### 5. Unit Test `viewModel.ts` — `test/unit/core/viewModel.vitest.ts`

**File to test:** `src/main/translationService/renderable/viewModel.ts`
**Target:** `buildViewModel()`, `applyRowSpans()`, `flattenNodes()`

**Tests:**
- Basic flattening preserves node hierarchy
- Multi-line parameter destructuring produces correct `translationRowSpan`
- Multiple overlapping row spans
- Row span at file boundary (first line, last line)
- Empty node list → empty view model
- Node with `sourceStartLine = 0` → filtered out
- Row span dedup in search — verify that spanned source lines don't create duplicate search matches

### 6. Unit Test `tooltipService.ts` — `test/unit/services/tooltipService.vitest.ts`

**File to test:** `src/main/tooltip/tooltipService.ts`
**Target:** Real `getNodeDetail()` pipeline, not mocked.

**Approach:**
1. Create a fixture with a known source file
2. Call `buildFileData()` to get `{ viewModel, astCache }`
3. Seed the project cache with the result
4. Call `tooltipService.getNodeDetail({ filePath, refPos })` with a known reference position
5. Verify the returned `TooltipData` contains:
   - Definition section (correct line, snippet)
   - References section (correct count, lines)
   - Type section (correct type text)
6. Test with cross-file references (use two fixture files)
7. Test with an invalid refPos → returns empty sections
8. Test with uncached file (cache miss) → falls back to reading from disk

**Note:** This requires `projectCache` to be populated. The test should:
- Create a ts-morph Project with the fixture file(s)
- Build the AstCache
- Call `setCache(filePath, astCache, viewModel, sourceText)`
- Verify tooltipService reads the cache correctly

### 7. Unit Test `projectCache.ts` — `test/unit/services/projectCache.vitest.ts`

**File to test:** `src/main/translationService/cache/projectCache.ts`

**Tests:**
- `setCache` and `getCache` — storing and retrieving
- `clearCache` — clears all entries
- `getRepoPath` / `setRepoPath` — path tracking
- Multiple files in cache independently
- Overwriting an existing cache entry
- Getting a non-existent path returns undefined

### 8. Unit Test `translationService.ts` — `test/unit/services/translationService.vitest.ts`

**File to test:** `src/main/translationService/translationService.ts`

**Approach:** Mock the file system (via vitest mocks or by providing a fixture path) and test:

- `.ts` file → builds view model via `buildFileData`
- `.tsx` file → builds view model via `buildFileData`
- `.js` file → returns empty view model (not translatable)
- `.css` file → returns empty view model
- Non-existent file → throws error
- Repeated call for same file → returns cached result
- Loading a different file → both cached independently

### 9. Unit Test `sourceService.ts` — `test/unit/services/sourceService.vitest.ts`

**File to test:** `src/main/sourceService/sourceService.ts`

- Read a real file from the fixture repo → correct lines returned
- Line numbers start at 1
- Empty file returns empty lines array
- File with trailing newline → last line not empty

### 10. Unit Test `projectService.ts` — `test/unit/services/projectService.vitest.ts`

**File to test:** `src/main/project/projectService.ts` (specifically tree building)

- Walk the fixture repo directory → tree matches expected structure
- `.` and `node_modules` directories filtered out
- Sorting: directories first, then files, alphabetical
- Deep nesting (subdirectories) → correct hierarchy
- Empty directory → empty children array

### 11. Unit Test `bucket.ts` — `test/unit/core/bucket.vitest.ts`

**Files to test:** Both `src/main/translationService/renderable/bucket.ts` and `src/lib/renderable/bucket.ts` (test both to verify they match)

- `bucketForType()` for each known type → correct bucket
- Unknown type → `'standard'` bucket
- `pickLineBucket()` with multiple node buckets → highest priority wins
- `return` + `hasJsx` → `'jsx'` bucket
- `import` type → `'import'` bucket

## File Organization

```
test/unit/
  core/
    translateType.vitest.ts
    phrasing.vitest.ts
    jsxHandler.vitest.ts
    makeSemanticGraph.vitest.ts
    viewModel.vitest.ts
    bucket.vitest.ts
  services/
    tooltipService.vitest.ts
    projectCache.vitest.ts
    translationService.vitest.ts
    sourceService.vitest.ts
    projectService.vitest.ts
```

## Success Criteria

- Every function in `translateType.ts` has explicit tests for all branches
- Every phraser in `PHRASERS` map has at least one test
- `jsxHandler.ts` has tests for `translateSingleClass` (all 8 Tailwind categories), `translateClassName`, `describeEventHandler`, `processAttributes`
- `makeSemanticGraph.ts` has tests for switch, class, object literal, all loop types, try/catch, all destructuring patterns
- `tooltipService.ts` tests run against the real `getNodeDetail` pipeline with seeded cache
- All other service files have basic instantiation/read/write tests
- Total unit tests: 100+ test cases
- `npm run test:unit` completes in <5 seconds
- Every test is tagged (via describe block or test name) so vitest --grep can filter
