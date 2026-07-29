# Phase 4: File view and client interactions

Cut over the code table and all non-tooltip file interactions to server-rendered HTML plus focused client controllers.

## Work

- Load the canonical file fragment through IPC on route changes and insert it through the shared htmx adapter.
- Preserve line/table structure, filenames, nested boxes, JSX markers, whitespace, buckets, independent scrolling, and stable semantic selectors.
- Implement source column resizing with pointer events, 20-80 percent clamping, cursor/text-selection cleanup, and deterministic debug state.
- Implement source/translation/all selection modes, buttons, copy-selection behavior, and `s`, `t`, `b` shortcuts without interfering with form fields.
- Implement search entirely in the renderer. Preserve case-insensitive literal matching, one match per row with source/translation flags, Cmd/Ctrl+F toggle, focus, Escape/close clearing, Enter/Shift+Enter and button wrapping, active/inactive marks, and smooth centered scrolling.
- Highlight text without replacing hoverable elements or losing their data attributes. Repeated searches and clearing must restore the original server fragment exactly.
- Apply `sourceLine`, `transLine`, and `var` deep links after swaps. `var` highlights both columns and scrolls to the first match without opening the search UI.
- Make async route loads stale-safe so a slower prior file cannot overwrite the newest route.
- Extend the read-only debug snapshot with file route, search matches/index, selection mode, source width, and relevant fragment HTML.
- Convert/add integration and Playwright tests for all behavior above. Prefer stable data selectors.

## Acceptance

- Search performs no IPC calls.
- Clearing search restores hover metadata and canonical text/markup.
- Navigation, sidebar, search, deep-link, selection, resize, stale-load, and scrolling tests pass.
- The debug snapshot reflects the DOM and ephemeral state agents need for a closed loop.
