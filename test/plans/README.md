# Test Architecture Vision

## Overall Goal
Give developers (human and agent) confidence that core translation logic works and UI surfaces render correctly, by layering fast unit tests over slow E2E tests so subsets can be run independently.

## Architecture

```
test/
  unit/                    ← Vitest (no browser, milliseconds)
    core/                  ← Translation engine: makeSemanticGraph, jsxHandler, translateType, phrasing, viewModel
    services/              ← File I/O wrappers: tooltipService, projectService, translationService, projectCache, sourceService

  integration/             ← Vitest + happy-dom (component-level, tens of milliseconds)
                           ← CodeTable search logic, HoverPopover states, ToolTip enrichment states

  e2e/                     ← Playwright (real browser, seconds)
                           ← Full-page rendering, hover popovers, search, navigation

  fixtures/
    repos/
      basic/               ← Stub repo with many language constructs
      complex/             ← Multi-file cross-reference repo
    loadFixture.ts         ← Shared harness: reads repo, calls buildFileData, injects into page
    base.ts                ← test.extend() fixture that provides repos to all Playwright tests
```

## Translation Principle (from AGENTS.md)
Keep it as simple as possible. Lua only has variables, tables, and functions. Represent TypeScript as close to this as possible.

## Testing Layers (from fastest to slowest)

| Layer | Tool | Speed | What it tests |
|-------|------|-------|---------------|
| Static | tsc + oxlint | seconds | Types, lint rules |
| Unit | Vitest | <1ms per test | Pure functions: translateType, phrasing, AstCache, viewModel math |
| Integration | Vitest + dom | ~50ms per test | Component behavior: CodeTable search dedup, HoverPopover states |
| E2E | Playwright | ~5-30s per test | Full-page rendering, real browser interactions, critical paths |

## Tag Convention
- `@unit` — Vitest test
- `@integration` — Component test
- `@e2e` — Playwright test
- `@smoke` — Critical path, runs on every change
- `@critical` — Important but not every-commit
- `@regression` — Full suite, runs nightly
- `@p0` through `@p3` — Priority tier
- `@slow` — Test takes >30s
- `@ui:{name}` — UI surface tag (e.g. `@ui:search`, `@ui:hover`)
- `@core:{name}` — Core engine tag (e.g. `@core:translation`, `@core:ast`)
- `@service:{name}` — Service tag (e.g. `@service:tooltip`, `@service:project`)

## Package.json Scripts (target)
```
test:typecheck    → tsc --noEmit
test:lint         → oxlint
test:unit         → vitest run
test:integration  → vitest run --config vitest.integration.config.ts
test:e2e          → playwright test
test:smoke        → playwright test --grep @smoke
test:regression   → playwright test --grep @regression
test:all          → typecheck + lint + unit + integration + e2e
test              → typecheck + lint + unit + e2e --grep @smoke
```

## Phases

- **Phase 1**: Fixture repo + shared harness + directory reorganization + configs
- **Phase 2**: Core unit test coverage (translateType, phrasing, jsxHandler, makeSemanticGraph, tooltipService, services)
- **Phase 3**: Integration tests (component-level) + complex fixture repo
- **Phase 4**: CI config + visual regression + agent ergonomics
