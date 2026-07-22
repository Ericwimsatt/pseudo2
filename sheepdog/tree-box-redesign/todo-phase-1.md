# Phase 1: CSS Grid Layout — rewrite CodeTable.tsx and LineRow.tsx

## Context

The current code uses `<table>`/`<tr>`/`<td>` for the code comparison layout. We're replacing it with CSS Grid. This eliminates table layout quirks and gives us a fixed icon column.

This phase is the first step. After this phase, the layout will use CSS Grid but the translation rendering will still use the old `NodeLayer` (with `paddingLeft`-based indentation, no tree boxes, no icon column content yet). Subsequent phases add nested boxes and update tests.

## What to do

### 1. Rewrite `src/App/components/CodeTable.tsx`

**Replace the `<table>` / `<colgroup>` / `<tbody>` with a CSS Grid `<div>`:**

The grid container should have:
```tsx
<div
  className="w-full font-mono text-sm"
  style={{
    display: 'grid',
    gridTemplateColumns: '6px 48px 1fr 4px 20px 1fr',
    gridAutoRows: 'auto',
    alignItems: 'start',
  }}
>
```

**Grid columns (6 total):**
| Col | Width | Content |
|-----|-------|---------|
| 1 | 6px | Marker (border-left, interface highlight) |
| 2 | 48px | Line number |
| 3 | 1fr | Source code |
| 4 | 4px | Resize handle |
| 5 | 20px | Icon column (always present, empty rows for Phase 2) |
| 6 | 1fr | Translation (NodeLayer) |

**Change the resize logic:**
- Currently sets `<col>` width via `sourcePct`
- Now rebuild the `gridTemplateColumns` string: `6px 48px ${sourcePct}% 4px 20px 1fr` (source column is a percentage, trans column is `1fr`)

**Change scroll-to-row selector:**
- `querySelector('tr[data-line="N"]')` → `querySelector('[data-line="N"]')`

**Keep unchanged:**
- All state (`sourcePct`, search, nav, etc.)
- All `useEffect` blocks (search, keydown, resize, nav highlight)
- `HoverPopover`
- `containerRef`
- `LineRow` import and usage patterns (the interface to LineRow changes slightly — see below)

**Rendering change:**
The `{viewModel.lines.map(...)}` currently returns `<LineRow>` components as `<tr>` elements. Now the grid uses direct `<div>` children, so `LineRow` returns a **React fragment** of multiple `<div>` grid cells. The `LineRow` component needs a new prop: `rowNum` (1-based grid row number). Pass `rowNum={i + 1}` from the map.

### 2. Rewrite `src/App/components/LineRow.tsx`

**Props change:** Add `rowNum: number` prop. Remove `sourcePct` (no longer needed — source width is managed at the grid level).

**Return fragment instead of `<tr>`:**

```tsx
return (
  <>
    {/* Marker */}
    <div
      className={cx('border-l-2', isInterface ? 'border-blue-500' : 'border-transparent')}
      style={{ gridRow: rowNum, gridColumn: 1 }}
    />
    {/* Line number */}
    <div
      className="text-right pr-3 py-1 text-gray-400 select-none border-r border-gray-200 bg-gray-50 align-top font-mono text-xs"
      style={{ gridRow: rowNum, gridColumn: 2 }}
    >
      {line.lineNumber}
    </div>
    {/* Source */}
    <div
      className={cx(
        'py-1 border-r border-gray-200 hover:bg-gray-50/40 transition-colors',
        bucketStyle,
        flash && 'animate-pulse bg-yellow-50'
      )}
      style={{ gridRow: rowNum, gridColumn: 3 }}
      data-bucket={BUCKET_LABELS[line.bucket]}
      data-line={line.lineNumber}
    >
      <div className="px-4 whitespace-pre-wrap break-words font-mono text-sm">
        {sourceContent}
      </div>
    </div>
    {/* Resize handle */}
    <div
      className="cursor-col-resize bg-gray-100 hover:bg-blue-300 active:bg-blue-400 p-0 border-r border-gray-200"
      style={{ gridRow: rowNum, gridColumn: 4 }}
      onMouseDown={onResizeStart}
    />
    {/* Icon column */}
    <div style={{ gridRow: rowNum, gridColumn: 5 }} />
    {/* Translation */}
    {showTranslation && (
      <div
        className="px-4 py-1 align-top"
        style={{ gridRow: `${rowNum} / span ${rowSpan || 1}`, gridColumn: 6 }}
      >
        <SearchContext.Provider value={searchCtxValue}>
          <NodeLayer nodes={line.nodes} />
        </SearchContext.Provider>
      </div>
    )}
  </>
);
```

**Row-level styles (`gridRow`, `gridColumn`):** All grid children must have explicit `gridRow` and `gridColumn` so CSS Grid places them correctly.

**`rowRef` removal:** The `<tr>` `ref` was used for the flash animation. Since we no longer have a single `<tr>`, put the `ref` (or a new **`lineRef`** of type `useRef<HTMLDivElement>(null)`) on the source cell (column 3) since it's always rendered and has `data-line`. The `flash` state and `isNavHighlight` logic remains unchanged.

**Search context and `SearchContext.Provider`:** Same wrapping as before. No changes to the search logic.

**`data-line` and `data-bucket` attributes:** Move from the `<tr>` to the source cell (column 3) so that `querySelector('[data-line="N"]')` finds it.

**Icon column:** Empty for now. Just a `<div>` with `gridColumn: 5`. In Phase 2 it gets content.

## Compatibility within the Grid

All cells for a single row must share the same `gridRow` value. The translation cell uses `gridRow: ${rowNum} / span ${rowSpan || 1}` when spanning, or `gridRow: ${rowNum}` when not spanning. When `translationRowSpan > 1`, the source cells for child lines should still render individually in their respective rows.

## Acceptance Criteria

1. `npm run test:typecheck` passes with no errors
2. `npm run test:lint` passes with no errors
3. The app still renders source lines, line numbers, and translation content
4. Column resize still works (drag the resize handle)
5. Search still highlights matches in both source and translation
6. Row spanning still works (multi-line function params)
7. Nav highlight still works (`sourceLine`, `transLine`, `var` params)

## Files that will be changed in subsequent phases

These should NOT be changed now (they'll be handled later):
- `src/App/components/nodes/NodeLayer.tsx` — modified in Phase 2
- `test/integration/CodeTable.integration.vitest.tsx` — modified in Phase 3
- `test/integration/LineRow.integration.vitest.tsx` — modified in Phase 3
- `test/e2e/*.spec.ts` — modified in Phase 3

## Verification

Run these commands after completing the phase:
```bash
npm run test:typecheck
npm run test:lint
```
