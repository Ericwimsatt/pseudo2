# Phase 1: Pure HTML renderer

Build the deterministic server-side HTML rendering foundation while leaving the active React renderer intact.

## Work

- Map the current markup and behavior in `src/App/components`, especially `CodeTable`, `LineRow`, node/box components, tooltip content, sidebar, landing page, and folder browser.
- Add a focused main-process HTML rendering module. Render the project shell/sidebar, file table, folder browser, landing/error/loading states, and tooltip content as composable fragments.
- Define a small fragment result type containing at least the HTML and enough metadata for route/debug assertions. Do not place unserializable values in it.
- Centralize context-correct HTML and attribute escaping. Cover quotes, ampersands, angle brackets, Unicode, file paths, source text, identifiers, tooltip metadata, and errors.
- Emit stable semantic data attributes for client behavior and tests: routes, files/directories, rows, source/translation cells, hover queries, resize handle, search controls, selection controls, tooltip sections, and fragment roots.
- Preserve existing classes/layout so visual behavior remains close during cutover. Ensure Tailwind can discover server template classes or replace fragile generated utility usage with explicit CSS.
- Add fast unit tests for representative TS and TSX view models, nested box markup, empty lines, plain files, tooltip sections, and hostile escaping inputs.

## Boundaries

- Rendering functions take existing domain/view-model data; they do not read files, mutate caches, invoke Electron, or access the DOM.
- Do not delete or route production traffic away from React in this phase.
- Do not duplicate translation logic in templates.

## Acceptance

- Every dynamic value is escaped exactly once at its output context.
- Unit tests can print and assert a complete file fragment without a browser.
- Existing tests remain green.
