# Production renderer migration

Replace the React renderer with main-process-generated HTML fragments, htmx-assisted swaps, and small focused browser controllers. This is a production migration, not a prototype.

## Primary outcomes

1. The main process owns canonical HTML generation. Typed IPC returns the same escaped fragments inserted into the renderer.
2. Agents can inspect a fragment without reverse-engineering React state. Provide a documented command or test helper that accepts a project and file and prints the canonical HTML response. Also expose a read-only renderer debug snapshot so Playwright can inspect DOM after client-only interactions.
3. Preserve current behavior and visual language on desktop and at the existing minimum tested viewport.
4. Remove React, React DOM, React Router, Floating UI React, React build plugins, and React test utilities after cutover.
5. Keep search client-side. Hover may invoke IPC and tolerate normal IPC latency.

## Architecture constraints

- htmx expects HTTP and Electron uses IPC. Do not add a localhost HTTP server or weaken Electron security. Implement one small typed IPC fragment adapter that invokes `window.electronAPI`, applies HTML through htmx's swap/process APIs, and centralizes loading, errors, and stale-response protection.
- Keep `contextIsolation: true` and `nodeIntegration: false`. Do not expose generic IPC send/invoke primitives.
- HTML renderers must be deterministic pure functions where practical. Escape text, attribute, path, identifier, metadata, snippet, and error values at the correct context boundary. Do not sanitize by stripping valid source text.
- Keep translation semantics in `src/main/translationService/`; do not move parsing or TypeScript compiler work into the renderer.
- Client code may own ephemeral UI state: search term/current match, source column width, sidebar expansion/collapse, tooltip geometry, and scroll position.
- Avoid introducing a template framework unless concrete duplication justifies it. Small composable TypeScript render functions are preferred.
- Preserve unrelated worktree changes. Do not commit or push from any phase.

## Required parity

- Restore last project and file, load a new folder from the Electron menu, load from the landing page, browse directories, and recursively upload a dropped directory.
- Sidebar tree expansion, selected file, collapse/expand, independent scrolling, and directory/file ordering.
- Hash routes `#/file/<path>` with back/forward and `sourceLine`, `transLine`, and `var` query parameters.
- Source/translation table markup, buckets, nested boxes, line numbers, sticky header, 20-80 percent resize, source/translation/all copy-selection modes and `s`/`t`/`b` shortcuts.
- Client-side case-insensitive literal search with Cmd/Ctrl+F, Escape, Enter/Shift+Enter, wrapping navigation, active/inactive marks, and centered scrolling. Highlighting must not destroy hover metadata or handlers.
- Async tooltip loading, errors, stale-request safety, positioning, safe dismissal, Escape, definition/reference snippets, and navigation links.
- Existing translation output and reviewed visual behavior.

## Agent closed loop

The finished system must support all three levels:

1. Pure renderer tests assert complete fragment HTML and escaping without Electron.
2. Typed IPC integration tests prove the IPC result is the fragment used by the renderer.
3. Playwright can call the exposed preload methods and a read-only `window.__pseudoDebug.snapshot()` (or an equivalently named documented API) to compare canonical IPC HTML with live DOM and inspect client state after search, resize, routing, and hover.

The debug API must expose only serializable read-only data and must not bypass the context bridge or permit arbitrary IPC.

## Quality rules

- Add stable semantic `data-testid`/`data-role` selectors instead of depending on utility classes or grid style substrings.
- Replace tests only when their implementation assumptions are obsolete; retain or improve behavioral coverage.
- Do not blindly regenerate visual baselines. Review differences, fix regressions, and update snapshots only for intentional markup/rendering changes.
- Do not leave parallel React and htmx production paths after the cleanup phase.
- All commands in `main.ts` are required gates. Fix failures rather than weakening tests or type checks.
