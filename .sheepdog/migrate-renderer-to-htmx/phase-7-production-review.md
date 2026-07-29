# Phase 7: Production review and hardening

Review the completed migration as a senior maintainer. Fix issues rather than only reporting them.

## Review areas

- Trace every user flow from preload API through services/renderers, IPC adapter, htmx swap, post-swap behavior, and tests. Remove duplicate paths and accidental abstractions.
- Verify canonical IPC HTML and inserted fragment equality. Document intentional client-owned DOM changes and ensure the debug snapshot exposes them.
- Audit escaping and path containment using adversarial source text, filenames, identifiers, tooltip metadata, snippets, browser errors, and uploaded paths.
- Audit request races for project changes, rapid file navigation, directory browsing, and hover. Old requests must not overwrite current state.
- Audit event listener lifecycle across repeated swaps and project changes. There must be no duplicate handlers or stale retained DOM.
- Audit keyboard and focus behavior, semantic controls, accessible names, tooltip focus/dismissal, and reduced-motion compatibility.
- Audit packaged-app behavior, CSP, local assets, htmx loading, Electron security options, and production error visibility.
- Audit performance on large files: avoid attaching listeners per line, repeated full-file parsing during search, unbounded tooltip HTML, and unnecessary full-shell swaps.
- Ensure debug/inspection facilities are read-only, serializable, deterministic, documented, and safe in production. They may reveal already-rendered app content but must not expose filesystem or generic IPC capabilities.
- Remove temporary compatibility code, stale comments, skipped/conditional tests, debug logging, obsolete snapshots, and dead dependencies.

## Final acceptance

- Build, typecheck, lint, unit, integration, complete E2E, visual, and smoke gates pass without retries or weakened assertions.
- The packaged renderer starts without React and without an HTTP server.
- An agent can render fixture HTML from a command, invoke typed fragment APIs in Playwright, inspect live DOM/client state, and correlate all three outputs.
- The implementation is smaller or materially simpler than the removed React path; any remaining complexity is justified by behavior or Electron/htmx integration needs.
