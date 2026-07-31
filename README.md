# PseudoTranslator

Source code translation visualization tool built with Electron, Vite, and htmx.

## Architecture

The renderer uses **main-process-generated HTML fragments** delivered through typed IPC and swapped into the DOM via htmx. There is no React, JSX, or virtual DOM.

### Layers

1. **Pure HTML renderers** (`src/main/htmlRenderer/`) — deterministic functions that take view-model data and return `HtmlFragment { html, metadata }`. No I/O, no Electron, no DOM.
2. **Fragment service** (`src/main/fragmentService.ts`) — orchestrates service calls (project loading, translation, tooltip) and passes results to the pure renderers.
3. **IPC handlers** (`src/main/fragmentController.ts`) — typed `ipcMain.handle` channels that the preload bridge exposes.
4. **Preload bridge** (`src/main/preload.ts`) — `contextBridge.exposeInMainWorld` with explicit typed methods.
5. **Client controllers** (`src/renderer/`) — small TypeScript modules for routing, sidebar state, file view interactions, search, hover/tooltips, and debug snapshots.
6. **IPC adapter** (`src/renderer/ipcAdapter.ts`) — centralizes fragment loading through `window.electronAPI` calls and htmx swap/process APIs.

### Key files

| File | Purpose |
|------|---------|
| `src/renderer/main.ts` | App bootstrap, route handling, project lifecycle |
| `src/renderer/router.ts` | Hash-based routing with back/forward |
| `src/renderer/sidebar.ts` | Sidebar expansion/collapse, file selection |
| `src/renderer/fileView.ts` | Column resize, selection modes, search, deep links |
| `src/renderer/hover.ts` | Tooltip hover positioning and content loading |
| `src/renderer/ipcAdapter.ts` | htmx IPC adapter with stale-request protection |
| `src/renderer/debug.ts` | `window.__pseudoDebug.snapshot()` for Playwright/agent inspection |
| `src/main/htmlRenderer/` | All pure HTML rendering functions |
| `src/main/fragmentService.ts` | Service orchestration for fragment generation |
| `src/main/fragmentController.ts` | IPC handler registration |

## Development

```bash
npm run dev
```

Starts the Vite dev server and Electron. The renderer loads from `http://localhost:5173`.

## Building

```bash
npm run build
```

Builds the Electron main process (`dist-electron/`) and the Vite renderer (`dist/`).

## Testing

See [test architecture docs](test/README.md) or run:

```bash
npm run test:typecheck   # TypeScript checks
npm run test:lint        # Oxlint
npm run test:unit        # Vitest unit tests
npm run test:integration # Vitest integration (happy-dom)
npm run test:e2e         # Playwright E2E tests
npm run test:smoke       # Critical path E2E
```

## Fragment Inspection

Inspect canonical HTML fragments without launching Electron:

```bash
npx tsx scripts/inspect-fragment.ts <project-path> <file-path> [--html] [--tooltip] [--sidebar]
```

Options:
- `--html` — print raw HTML without metadata wrapper
- `--tooltip` — render tooltip fragment for the given file
- `--sidebar` — render sidebar fragment for the project tree

Example:
```bash
npx tsx scripts/inspect-fragment.ts test/fixtures/repos/language-features Functions.tsx --html
```

## Debug API

`window.__pseudoDebug.snapshot()` returns a read-only serializable snapshot of current app state, including route, sidebar state, file view state (selection mode, search), hover state, and DOM HTML. Used by Playwright tests and agent debugging.