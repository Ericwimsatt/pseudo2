# Phase 3: Integration Tests + Complex Fixture

## Objective
Add integration tests that verify component-level behavior in a DOM environment (Vitest + happy-dom). These are faster than Playwright E2E tests but more realistic than pure unit tests — they mount React components and verify behavior through DOM assertions. Also create a complex multi-file fixture repo for cross-reference testing.

## Prerequisites
- Phase 1 complete: fixture repo, shared harness, test directory structure
- Phase 2 complete: core translation engine unit tests exist
- `vitest.integration.config.ts` exists (or will be created here)

## Key Architectural Decisions

- Integration tests use Vitest with `happy-dom` environment (or `jsdom` — choose the one that handles `@floating-ui/react` better)
- Components are rendered with `@testing-library/react` (must be installed if not present)
- The real `buildFileData` output feeds into component props — no mocking of the translation layer
- electronAPI calls are still mocked (the IPC bridge doesn't exist in Node), but the mocks return real data from `buildFileData`
- Complex repo tests verify cross-file reference behavior in tooltips

## Tasks

### 1. Create Complex Fixture Repo: `test/fixtures/repos/cross-refs/`

A multi-file TypeScript project with real cross-file references:

```
cross-refs/
  src/
    types.ts                  ← Shared interfaces and type aliases
    utils.ts                  ← Utility functions exported
    hooks/
      useData.ts              ← Custom hook that uses types and utils
    components/
      DataList.tsx            ← Component that uses the hook and types
      DataItem.tsx            ← Sub-component with props from types
    App.tsx                   ← Root component importing everything
```

**Constructs to exercise:**
- `import { Type } from './types'` → cross-file type resolution
- `import { useData } from '../hooks/useData'` → cross-file hook reference
- `interface Props` in one file, used in another → go-to-definition crosses files
- `export` / `import` cycle → no circular dependency crash
- Function defined in `utils.ts`, called in `components/DataList.tsx` → reference tracking across files

### 2. Set Up Integration Test Config

Create `vitest.integration.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['test/integration/**/*.integration.vitest.ts'],
    environment: 'happy-dom',
    setupFiles: ['test/integration/setup.ts'],
    globals: true,
  },
});
```

Create `test/integration/setup.ts` — configure testing-library matchers.

Add dependency if needed: `npm install -D @testing-library/react @testing-library/jest-dom happy-dom`

Add package.json script:
```
"test:integration": "vitest run --config vitest.integration.config.ts"
```

### 3. Integration Test: `CodeTable` — `test/integration/CodeTable.integration.vitest.ts`

**Note:** `CodeTable.tsx` is 343 lines with complex state. For true isolation, we may need to either:
- Refactor `CodeTable` to accept props for test injection, OR
- Test it through the `App` component with mocked electronAPI (like Playwright does, but in happy-dom)

**Approach 1 (preferred):** Extract the search/match logic into pure functions that can be unit-tested:
- `computeMatches(sourceLines, translationNodes, searchTerm)` → `Match[]`
- `dedupMatches(matches, rowSpans)` → `Match[]`
- `navigateMatches(matches, currentIndex, direction)` → `{ index, match }`

These can be tested in plain Vitest (no DOM needed, could actually go in Phase 2). The component integration test then mounts `CodeTable` and verifies:
- Table renders rows for each source line
- Bucket coloring is applied to rows
- Search input appears on Cmd+F
- Match count display updates as user types
- Active match highlighting moves on Enter
- Row span merges translation cells correctly

**Approach 2 (fallback):** Render the full `App` with mock electronAPI in happy-dom, then test the same behaviors as Playwright but without a real browser. This is closer to an E2E test but runs faster.

**For this plan, use Approach 1 where possible:**

Test `computeMatches`:
- Empty search → empty matches
- Search term matches source text → match includes source line
- Search term matches translation text → match includes translation cell
- Search term matches both → one deduplicated match
- Case insensitive matching
- Regex characters in search are escaped

Test `dedupMatches`:
- Two matches on same line with rowSpan → deduplicated to one
- Matches on different lines → kept separate
- Match in spanned source area → merged with parent line

### 4. Integration Test: `LineRow` — `test/integration/LineRow.integration.vitest.ts`

**Mount a single LineRow with props and verify:**
- Source text renders correctly
- Line number shows in the second cell
- Bucket class is applied to the row
- Search highlight (mark elements) render when searchTerm is provided
- Active match gets yellow highlight vs light yellow for inactive
- Flash animation class is applied briefly on mount (with `sourceLine` URL param)
- Row span attribute (`rowSpan`) is applied to translation cell

### 5. Integration Test: `HoverPopover` — `test/integration/HoverPopover.integration.vitest.ts`

**Verify hover interaction without a real browser:**
- `useSafePolygonDismiss` logic:
  - Setting hover triggers popover after delay
  - Leaving trigger starts dismiss timer
  - Entering popover during dismiss timer cancels dismiss
  - Escape key dismisses immediately
- ToolTip component:
  - Loading state shows spinner
  - Static tooltip (hook tooltip) renders title + body
  - Enrichment tooltip renders definition, references, type sections
  - Error state (when getNodeDetail rejects) shows error message
  - `askedRef` guard prevents duplicate fetch

**Note:** `@floating-ui/react` requires real browser layout metrics. For happy-dom, you may need to mock floating-ui or test the logic extraction separately (the dismiss hook, the state machine in ToolTip).

### 6. Integration Test: `FolderBrowser` — `test/integration/FolderBrowser.integration.vitest.ts`

**Mount FolderBrowser with mock data:**
- Shows current path
- Directory listing renders with folder names
- "Up" button navigates to parent
- Loading state shows spinner
- Error state shows error message
- Select button triggers the callback
- Cancel button closes the modal

### 7. Playwright E2E: Cross-File Tooltip Tests

Add a new Playwright spec `test/e2e/tooltips.spec.ts` that uses the `cross-refs` fixture repo:

- Load a file that imports from another file
- Hover over a symbol that resolves to a definition in another file
- Verify the popover shows "Definition (line X)" with the correct file path
- Verify the snippet shows the definition context lines
- Hover over a hook call → verify it shows the hook's definition from the hook file
- Hover over a type → verify type information displays correctly

### 8. Playwright E2E: Sidebar Navigation

Add `test/e2e/sidebar.spec.ts` using the `cross-refs` repo:

- Sidebar shows directory tree with expandable folders
- Root-level files visible without expanding
- Clicking a directory expands/collapses its children
- Clicking a file loads it in the main view
- Active file is highlighted in the sidebar
- Sidebar collapse button works (toggles to narrow bar)

### 9. Playwright E2E: Language Feature Rendering

Add `test/e2e/language-features.spec.ts` using the `language-features` repo:

- Open `Functions.tsx` → verify "Function" and "Parameters" text rendered
- Open `JSXElements.tsx` → verify JSX element names, attributes, className translations
- Open `Interfaces.ts` → verify interface properties show with English descriptions
- Open `ControlFlow.tsx` → verify "If", "For", "While", "Switch" render correctly
- Open `Classes.ts` → verify "Class" and "Method" render (even if partial)
- Take screenshots of each file for visual verification (can later become baseline for Phase 4)

### 10. Update Fixture Harness

Enhance `test/fixtures/base.ts` to support:
- Loading different repos per test file (not just `language-features`)
- Providing a `getNodeDetail` mock that simulates enrichment data for specific `refPos` values
- Providing a `getNodeDetail` mock that calls the real AstCache (via pre-seeded data)

## Files to Create

- `test/fixtures/repos/cross-refs/src/types.ts`
- `test/fixtures/repos/cross-refs/src/utils.ts`
- `test/fixtures/repos/cross-refs/src/hooks/useData.ts`
- `test/fixtures/repos/cross-refs/src/components/DataList.tsx`
- `test/fixtures/repos/cross-refs/src/components/DataItem.tsx`
- `test/fixtures/repos/cross-refs/src/App.tsx`
- `vitest.integration.config.ts`
- `test/integration/setup.ts`
- `test/integration/CodeTable.integration.vitest.ts`
- `test/integration/LineRow.integration.vitest.ts`
- `test/integration/HoverPopover.integration.vitest.ts`
- `test/integration/FolderBrowser.integration.vitest.ts`
- `test/e2e/tooltips.spec.ts`
- `test/e2e/sidebar.spec.ts`
- `test/e2e/language-features.spec.ts`

## Success Criteria
- Integration tests run in <30 seconds (vs minutes for Playwright)
- Complex repo tests verify cross-file reference resolution
- CodeTable search logic is verified at the function level (unit) and component level (integration)
- HoverPopover dismiss logic is verified without a real browser
- At least 3 new Playwright E2E tests cover: tooltips, sidebar, and language feature rendering
- All integration tests pass in happy-dom environment
- `npm run test:integration` is a valid command
