## QA
Every change should be checked for quality.

### Test Architecture
This project uses a layered test approach:
- **Unit tests** (Vitest): `test/unit/` - pure logic, no browser. Fastest.
- **Integration tests** (Vitest + happy-dom): `test/integration/` - component-level.
- **E2E tests** (Playwright): `test/e2e/` - full browser, slowest.
- **Fixture repos**: `test/fixtures/repos/` - real .ts/.tsx files loaded by tests.

### Test Layers
- **Unit tests** (`npm run test:unit`) - pure translation logic, no browser. Run for any change to `src/main/translationService/`.
- **E2E tests** (`npm run test:e2e`) - full browser tests. Run for UI changes.
- **Smoke tests** (`npm run test:smoke`) - critical path only (<5 min). Run before any merge.
- **Typecheck + lint** (`npm run test:typecheck && npm run test:lint`) - always run.

### Available Scripts
| Command | What it runs | Target time |
|---------|-------------|-------------|
| `npm run test:typecheck` | tsc --build --force | <10s |
| `npm run test:lint` | oxlint | <5s |
| `npm run test:unit` | all vitest unit tests | <10s |
| `npm run test:integration` | vitest integration (DOM) | <30s |
| `npm run test:e2e` | all Playwright tests | <5min |
| `npm run test:smoke` | Playwright @smoke subset | <2min |
| `npm run test:regression` | Playwright @regression subset | ~15min |
| `npm run test:all` | typecheck + lint + unit + integration + e2e | ~10min |

### Test Tags (Playwright)
- `@smoke` - critical path, run before every commit
- `@critical` - important but not every-commit
- `@regression` - full suite
- `@visual` - screenshot comparison
- `@slow` - takes >30s
- `@quarantine` - known-flaky, skip during eval
- `@ui:{name}` - e.g. `@ui:search`, `@ui:hover`, `@ui:sidebar`
- `@core:{name}` - e.g. `@core:translation`, `@core:rendering`

### Task Definitions (sheepdog)

In `sheepdog/<task>/task.yaml`, always use `npx vitest run` (not `npx vitest`) in `runAfter`/`runBeforeAll`/`runAfterAll` commands. Bare `vitest` defaults to **watch mode** and never exits, stalling the task indefinitely.

### Agent Instructions

### Lint
Always run a lint to check for syntax and type errors. Generally the solution to the type error is to fix the type or fix the call, not to bypass typechecking or make things options
npx tsc --noEmit

### Translation principle
Keep it as simple as possible. Lua, the language, only has variables, tables, and functions. I want to represent typescript as close to this as possible

### Sheepdog
To create a sheepdog task, see the instructions in ../sheepdog folder