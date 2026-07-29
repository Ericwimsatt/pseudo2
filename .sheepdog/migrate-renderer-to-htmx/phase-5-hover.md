# Phase 5: Async hover and tooltip cutover

Replace the React/Floating UI hover stack with delegated client behavior and server-rendered tooltip fragments.

## Work

- Use data attributes emitted by the file renderer for hover queries (`filePath`, `refPos`, and optional identifier). Do not embed complete semantic tooltip payloads in file HTML.
- On delegated pointer/focus entry, show a loading tooltip and invoke the typed tooltip-fragment IPC method. Render its exact returned HTML through the shared htmx adapter.
- Protect against stale responses, rapid target changes, target removal during a file swap, and `refPos === 0`.
- Preserve loading, static, enriched, empty, and error states with stable selectors.
- Implement viewport-aware offset/flip/shift positioning, repositioning on scroll/resize, delayed dismissal, safe trigger-to-tooltip movement, focus behavior, and Escape dismissal. A small geometry helper is preferred over another framework.
- Preserve title/body/metadata, type/definition/reference sections, source snippets, and tooltip links. Links must route through the common hash navigation path with encoded file/query values.
- Extend integration tests for request races, dismissal, geometry edge cases, errors, static identifiers, and tooltip navigation. Strengthen E2E tests so they fail when no hover target exists rather than conditionally passing.
- Include tooltip target/request/status and popup HTML in the read-only debug snapshot.

## Acceptance

- Hover latency includes one IPC round trip and remains visibly responsive with a loading state.
- Late responses can never populate the wrong tooltip.
- Tooltip content in the live DOM is exactly the escaped fragment returned by IPC, apart from client-owned positioning attributes/styles.
- Hover, enrichment, and cross-reference E2E suites pass.
