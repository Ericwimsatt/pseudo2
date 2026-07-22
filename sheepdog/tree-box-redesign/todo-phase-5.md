# Phase 5: Update visual baselines, run smoke tests, manual verification

## Context

All code changes and test selector updates are complete. This phase:
1. Generates new visual baseline screenshots (the layout changed from table to grid + nested boxes)
2. Runs the smoke test suite
3. Runs manual verification for features that aren't covered by automated tests

## What to do

### 1. Update visual snapshots

The visual regression tests in `test/e2e/visual.spec.ts` use `toHaveScreenshot()`. The reference images are now outdated because the layout changed completely. Regenerate them:

```bash
npx playwright test --grep @visual --update-snapshots
```

This may take a few minutes. It will generate new PNG baseline images in the `test/screenshots/` directory (or wherever the snapshot config points).

**Note:** If there are rendering issues (e.g., missing content), fix them in the source code and re-run the update.

### 2. Run smoke tests

```bash
npx playwright test --grep @smoke --reporter list
```

Fix any failures. Common issues:
- Selector mismatches (already should be fixed in Phase 3, but some may have been missed)
- Feature regression (a feature stopped working due to the grid migration)
- Timeout issues (the app may render differently and need different wait strategies)

### 3. Manual verification checklist

These features are hard to fully test with automated tests:

| Feature | How to verify |
|---------|---------------|
| **Column resize** | Open a file, drag the resize handle between source and translation. The source column should resize smoothly. |
| **Row spanning** | Open a file with multi-line function parameters (e.g., `FilterBar.tsx` from navigation test). The translation should span across the correct source lines. |
| **Translation wrapping** | Resize the window narrow. Translation text should wrap inside the grid column. The nested box borders should follow the wrapped content. |
| **Nested box colors** | Open a file with deeply nested code (e.g., function > if > return). Verify depth 0 is blue, depth 1 is green, depth 2 is amber. |
| **Empty translation** | Lines with no translation nodes should show a gray `—`. |
| **Blank lines** | Blank source lines between code blocks should render as empty grid rows. |
| **Search in translation** | Press Ctrl+F, search for text that appears in translation boxes. Verify `<mark>` highlights appear inside the boxes. |
| **Hover tooltips** | Hover over hoverable spans in the translation. Verify popover appears and dismisses. |
| **Nav URL params** | Test `?sourceLine=N`, `?transLine=N`, `?var=name` in the URL. |
| **Performance** | Open a large file. Scrolling should be smooth. The grid should handle 100+ lines without lag. |
| **Border alignment** | Each top-level tree box should start flush left (no margin) in the translation column. Nested boxes should indent 16px per level. |

### 4. Run full regression (optional but recommended)

If the smoke tests pass and manual verification looks good:

```bash
npx playwright test --grep @regression --reporter list
```

This runs the full regression suite (about 15 minutes). Fix any failures.

### 5. Final check

```bash
npm run test:all
```

This runs typecheck + lint + unit + integration + e2e. All should pass.

## Acceptance Criteria

1. `npm run test:smoke` passes
2. Visual regression screenshots are updated and passing
3. Manual verification confirms all features work (see checklist above)

## Verification

```bash
npx playwright test --grep @smoke --reporter list
npx playwright test --grep @visual --reporter list
```
