# Phase 6: Remove React and migrate the full test suite

Delete the parallel implementation, clean the build, and make all tests exercise the production htmx/IPC renderer.

## Work

- Confirm no production imports reference React components, contexts, hooks, or React-only helpers, then delete obsolete TSX files and dead code.
- Remove React, React DOM, React Router, Floating UI React, React Vite plugin, React types, Testing Library React packages, and unused JSX/lint/build configuration. Regenerate the lockfile through npm.
- Keep Vite, PostCSS, and Tailwind only where still useful. Ensure production Electron builds load the static renderer correctly and all server-rendered classes/styles are included.
- Rewrite React integration tests as pure renderer, client-controller happy-dom, IPC integration, or Playwright tests at the lowest useful layer.
- Update fixture bridge injection to return canonical fragments while retaining direct access for assertions. Make recursive fixture trees realistic.
- Replace brittle utility-class/grid-style selectors with stable semantic selectors.
- Add missing production coverage for startup persistence, project switching, menu folder loading, drop upload, back/forward, selection modes, resizing, scrolling, stale requests, and errors.
- Run the complete E2E suite. Review visual diffs one by one; fix regressions and update snapshots only where the new canonical markup intentionally changes rendering.
- Update README architecture, development, testing, fragment inspection, and agent-debugging instructions.

## Acceptance

- `package.json`, lockfile, source, tests, and config contain no React runtime/test dependencies or active React code.
- There is one production renderer path.
- Unit, integration, full E2E, visual, build, typecheck, and lint checks pass.
- Documentation gives agents concrete commands for canonical IPC/service HTML and live renderer snapshots.
