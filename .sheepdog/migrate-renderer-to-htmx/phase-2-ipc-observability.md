# Phase 2: Typed fragment IPC and observability

Make canonical HTML available through narrow typed services, IPC handlers, the preload bridge, and an agent-friendly inspection path. Keep React active.

## Work

- Extend `src/shared/api.ts`, preload, and controllers with explicit fragment operations for project bootstrap/shell, file view, directory browser, and node detail tooltip. Prefer structured `{ html, ...metadata }` results over bare strings.
- Consolidate redundant source/translation loads where appropriate. Reuse existing project, translation, tooltip, browser, and persistence services rather than invoking one IPC handler from another.
- Ensure the file and tooltip operations call the exact pure renderers from phase 1; there must not be a second test-only rendering implementation.
- Define consistent serializable error behavior. Expected user errors should produce typed error data or escaped error fragments; programming errors must remain visible to tests/logging.
- Add an inspection command or deterministic harness documented in the README. It must accept a project path and file path (including fixture repositories), initialize the same services as production, and print the canonical file HTML returned by the fragment service. Avoid requiring a visible Electron window.
- Add typed IPC/service integration tests proving project loading, file rendering, tooltip rendering, directory browsing, persistence, and errors. Assert that IPC/service HTML equals direct renderer output for the same input.
- Keep old IPC methods temporarily if React still requires them, but mark the migration boundary clearly; do not add generic `invoke(channel, payload)` exposure.

## Security and correctness

- Validate resolved file paths remain inside the loaded repository before reading them.
- Clear or correctly scope translation/tooltip caches when changing projects.
- Handle `refPos` zero correctly and preserve optional identifiers.
- Do not expose Node APIs, filesystem access, or arbitrary channels to the renderer.

## Acceptance

- An agent can run one documented command and inspect exact canonical HTML for a fixture file.
- Renderer-accessible fragment methods are fully typed end-to-end.
- Integration tests include malicious source/path/error strings and stale-project cache coverage.
