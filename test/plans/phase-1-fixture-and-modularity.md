# Phase 1: Fixture Repo + Shared Harness + Modularity

## Objective
Create the foundation that all subsequent phases build on: a stub repo on disk with real `.ts`/`.tsx` files that exercise many language constructs, a shared fixture harness that reads the repo and injects mock `electronAPI` into Playwright pages, and a reorganized directory structure with updated configs so agents can run test subsets.

## Key Architectural Decisions (must be consistent with other phases)

- `buildFileData()` is a pure function called in Node.js context (the test file), not in the browser. The resulting `ViewModel` is serialized via `addInitScript` into the page. This is identical to how the real app works (the main process calls `buildFileData` and sends the ViewModel over IPC).
- The shared fixture must produce a `{ tree, files, repoPath }` object that any test can consume.
- Repo files must be organized as a real directory on disk (not inline strings) so they can be version-controlled and reused across phases.

## Tasks

### 1. Create the Stub Repo: `test/fixtures/repos/language-features/`

Create a directory with `.ts` and `.tsx` files that exercise as many language constructs as possible. This repo will be the primary test fixture. Split constructs across files logically.

**Required constructs to cover (these are the minimum for Phase 2 confidence):**

| File | Constructs |
|------|-----------|
| `Functions.tsx` | Function declarations, arrow functions (block body + expression body), default params, rest params, destructured params, generics, JSDoc comments |
| `Hooks.tsx` | useState, useEffect, useMemo, useCallback, useRef, useContext, custom hooks, useReducer, useLayoutEffect, useImperativeHandle, forwardRef |
| `JSXElements.tsx` | Self-closing elements, children, fragments (`<>...</>` and `<Fragment>`), ternary in JSX, `&&` in JSX, spread attributes, key prop, ref prop, style object, event handlers (onClick, onChange, onSubmit, onKeyDown, onMouseEnter) |
| `Collections.tsx` | Array.map, Array.filter, Array.reduce, nested map, map with conditional, Set, Map, forEach |
| `Interfaces.ts` | Interface extends, optional properties, readonly properties, index signatures, call signatures, generic interfaces, intersection/union types |
| `TypeAliases.ts` | Union types, intersection types, literal types, mapped types, conditional types, template literal types, utility types (Pick, Omit, Partial, Required) |
| `ControlFlow.tsx` | If/else, ternary, switch/case, for loop, for-of, for-in, while, do-while, try/catch, throw |
| `Classes.ts` | Class with constructor, methods, getters/setters, static members, extends, implements, abstract class, private/protected/public |
| `Imports.ts` | Default import, named import, namespace import, type import, dynamic import(), re-export, export default, export named |
| `LiteralsAndExpressions.ts` | String literals (template literals, tagged templates), number bigint, boolean, null/undefined, object literals, array literals, computed property names, method shorthand, spread operator, destructuring (array + object), nullish coalescing, optional chaining |
| `Enums.ts` | Numeric enum, string enum, const enum, reverse mappings |
| `Async.ts` | async/await, Promise.all, Promise.race, try/catch with async, generator functions, yield, for-await-of |
| `ReactPatterns.tsx` | DefaultProps, displayName, memo, useMemo + useCallback patterns, custom hook with return tuple, render props pattern, context provider/consumer, useEffect cleanup |

**Each file should:**
- Be real, parseable TypeScript/TSX
- Use different variable names so tools can reference each
- Have comments (they'll be visible in translation)
- Be small enough to keep test assertions minimal (~20-50 lines each)
- Not depend on external packages (no React imports in types-only files)

### 2. Create the Shared Harness: `test/fixtures/loadFixture.ts`

```typescript
Build a function `loadFixtureRepo(fixtureDir: string): Promise<FixtureData>` that:
1. Recursively walks the fixture directory
2. For each .ts/.tsx file, reads its content and calls buildFileData(source, relPath)
3. Returns { tree, files: Map<relPath, { viewModel, sourceLines }>, repoPath }
4. Filters out node_modules and dotfiles
5. Sorts tree entries: directories first, then files, alphabetical

Also export a type FixtureData for reuse.
```

### 3. Create Shared Playwright Fixture: `test/fixtures/base.ts`

```typescript
Use Playwright's test.extend() to create a base fixture that:
1. Loads the language-features repo once per test file (not per test)
2. Provides an injectFixture(page, fixture, options?) helper
3. The helper sets up: localStorage.repoPath, window.electronAPI mock
4. The mock handles: loadProject, getTree, loadFileSource, loadFileTranslation,
   getNodeDetail (returning { sections: [] }), browseDirectory, uploadFolder,
   openDirectorySelector, onMenuLoadFolder
```

### 4. Reorganize Test Directory

```
Before:
  test/
    annual.spec.ts
    authcontext.spec.ts
    enrichment.spec.ts
    hover.spec.ts
    importedTypes.spec.ts
    navigation.spec.ts
    astCache.vitest.ts
    semanticGraph.vitest.ts

After:
  test/
    unit/
      astCache.vitest.ts
      semanticGraph.vitest.ts
    e2e/
      annual.spec.ts
      authcontext.spec.ts
      enrichment.spec.ts
      hover.spec.ts
      importedTypes.spec.ts
      navigation.spec.ts
    fixtures/
      repos/
        language-features/    (created above)
      loadFixture.ts           (created above)
      base.ts                  (created above)
    plans/
      ...
```

### 5. Update Vitest Config: `vitest.config.ts`

```
Change test.include to: ['test/unit/**/*.vitest.ts']
```

### 6. Update Playwright Config: `playwright.config.ts`

```
- Change testDir to: './test/e2e'
- Add use.baseURL: 'http://localhost:5174'
- Add webServer config:
    command: 'vite --port 5174'
    port: 5174
    reuseExistingServer: true
- Add projects:
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
- Import devices from '@playwright/test'
```

### 7. Update Package.json Scripts

```
- Add: "test:typecheck": "tsc --noEmit"
- Add: "test:lint": "oxlint"
- Add: "test:unit": "vitest run"
- Add: "test:e2e": "playwright test"
- Add: "test:smoke": "playwright test --grep @smoke"
- Add: "test:regression": "playwright test --grep @regression"
- Add: "test:all": "npm run test:typecheck && npm run test:lint && npm run test:unit && npm run test:e2e"
- Keep: "test" → "npm run test:typecheck && npm run test:lint && npm run test:unit && npm run test:e2e -- --grep @smoke"
- Update: "lint" was "oxlint" — this becomes "test:lint", keep alias
- Add: "lint": "npm run test:lint" as alias (for backward compat)
- Add: Prepare script: no, just document
```

### 8. Tag Existing Tests

Add Playwright tags (`// @tag`) to each existing spec file:

| File | Tags |
|------|------|
| `annual.spec.ts` | `@smoke @p0 @core:translation` |
| `authcontext.spec.ts` | `@smoke @p0 @core:rendering` |
| `hover.spec.ts` | `@critical @p1 @ui:hover` |
| `enrichment.spec.ts` | `@regression @p2 @ui:hover` |
| `navigation.spec.ts` | `@critical @p1 @ui:search @ui:navigation` |
| `importedTypes.spec.ts` | `@critical @p1 @core:translation` |
| `astCache.vitest.ts` | (no tags needed — vitest uses file patterns) |
| `semanticGraph.vitest.ts` | (no tags needed — vitest uses file patterns) |

### 9. Refactor One Spec to Use the Fixture

Pick `hover.spec.ts` as the first spec to refactor:
- Remove inline SOURCE constant
- Import from the shared fixture
- Use `injectFixture(page, fixture)` instead of manual `addInitScript`
- Keep all test assertions identical — this is a structural refactor only

### 10. Update AGENTS.md

Replace the current QA section with:

```markdown
## QA
Every change should be checked for quality.

### Test Layers
- **Unit tests** (`npm run test:unit`) — pure translation logic, no browser. Run for any change to `src/main/translationService/`.
- **E2E tests** (`npm run test:e2e`) — full browser tests. Run for UI changes.
- **Smoke tests** (`npm run test:smoke`) — critical path only (<5 min). Run before any merge.
- **Typecheck + lint** (`npm run test:typecheck && npm run test:lint`) — always run.

### Agent Instructions
- For single-service changes: `npx vitest test/unit/services/<name>.vitest.ts`
- For single UI surface: `npx playwright test --grep @<surface>`
- For a full check: `npm run test:typecheck && npm run test:lint && npm run test:unit && npm run test:smoke`
- Always run the app from a port other than 5173 (use DEV_PORT env).
- Tag new Playwright tests with appropriate @smoke/@critical/@regression tags.
- New unit tests go in test/unit/core/ or test/unit/services/.
```

### 11. Verify

1. Run `npm run test:typecheck` — must pass
2. Run `npm run test:unit` — must pass (same tests as before)
3. Run `npm run test:smoke` — must pass (tagged tests only)
4. Run `npm run test:e2e` — must pass (all Playwright tests)
5. Run the refactored hover.spec.ts in isolation: `npx playwright test test/e2e/hover.spec.ts` — must pass

## Files to Create/Modify

### Create
- `test/fixtures/repos/language-features/Functions.tsx`
- `test/fixtures/repos/language-features/Hooks.tsx`
- `test/fixtures/repos/language-features/JSXElements.tsx`
- `test/fixtures/repos/language-features/Collections.tsx`
- `test/fixtures/repos/language-features/Interfaces.ts`
- `test/fixtures/repos/language-features/TypeAliases.ts`
- `test/fixtures/repos/language-features/ControlFlow.tsx`
- `test/fixtures/repos/language-features/Classes.ts`
- `test/fixtures/repos/language-features/Imports.ts`
- `test/fixtures/repos/language-features/LiteralsAndExpressions.ts`
- `test/fixtures/repos/language-features/Enums.ts`
- `test/fixtures/repos/language-features/Async.ts`
- `test/fixtures/repos/language-features/ReactPatterns.tsx`
- `test/fixtures/loadFixture.ts`
- `test/fixtures/base.ts`

### Move
- `test/annual.spec.ts` → `test/e2e/annual.spec.ts`
- `test/authcontext.spec.ts` → `test/e2e/authcontext.spec.ts`
- `test/enrichment.spec.ts` → `test/e2e/enrichment.spec.ts`
- `test/hover.spec.ts` → `test/e2e/hover.spec.ts`
- `test/importedTypes.spec.ts` → `test/e2e/importedTypes.spec.ts`
- `test/navigation.spec.ts` → `test/e2e/navigation.spec.ts`
- `test/astCache.vitest.ts` → `test/unit/astCache.vitest.ts`
- `test/semanticGraph.vitest.ts` → `test/unit/semanticGraph.vitest.ts`

### Modify
- `vitest.config.ts` — update include path
- `playwright.config.ts` — add webServer, projects, baseURL
- `package.json` — add scripts
- `AGENTS.md` — rewrite testing section

## Success Criteria
- All existing tests pass after reorganization
- `npm run test:unit` runs only vitest tests, completes in <2s
- `npm run test:e2e` runs only Playwright tests
- `npm run test:smoke` picks up tagged tests only
- A spec file can load the fixture repo with 3 lines of code
- The fixture repo covers all 13 categories listed above
