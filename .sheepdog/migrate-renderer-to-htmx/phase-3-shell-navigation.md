# Phase 3: Static shell, projects, and navigation

Introduce the non-React renderer shell and cut over project lifecycle, landing, folder selection, routing, and sidebar behavior.

## Work

- Add htmx as a renderer dependency and replace the React bootstrap with a small TypeScript entrypoint and static app root.
- Implement one IPC fragment adapter. It should invoke named typed preload methods, use htmx swap/process APIs for fragment insertion, and centralize target lookup, loading state, escaped errors, request identity, and post-swap hooks. Do not emulate HTTP or add a local web server.
- Restore the last project and file on startup. Preserve load failures and saved-path clearing behavior.
- Implement landing-page folder browse/select, loading/errors, drag-over state, and recursive dropped-directory upload.
- Handle `menu-load-folder` subscription and cleanup.
- Implement hash routing and back/forward without duplicate history entries. Correctly encode/decode file paths and query parameters.
- Implement recursive sidebar expansion, selected state, collapse/expand, and independent scroll. Preserve sidebar client state across file-fragment swaps.
- Add a read-only serializable debug API such as `window.__pseudoDebug.snapshot()` that returns current app HTML, route, active fragment/request state, and relevant ephemeral UI state. It must not mutate the app or expose generic IPC.
- Add/convert happy-dom integration tests for bootstrap, folder browser, project switching, menu events, history, route encoding, and sidebar state.

## Acceptance

- No production interaction in this scope requires React.
- The renderer receives project markup only from typed fragment IPC and swaps it through the shared adapter.
- Back/forward, menu folder loading, native browse, and dropped folders have behavioral tests.
- Debug snapshots let Playwright inspect the live DOM after a swap.
