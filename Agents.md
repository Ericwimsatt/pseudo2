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
| `npm run test:typecheck` | tsc --noEmit | <10s |
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

### Agent Instructions

#### Evaluating a Change
1. Always start with the fastest checks: `npm run test:typecheck && npm run test:lint`
2. If changing translation logic: `npx vitest test/unit/core/`
3. If changing a service: `npx vitest test/unit/services/<service-name>.vitest.ts`
4. If changing a UI component: `npx playwright test --grep @ui:<component-name>`
5. Before submitting: `npm run test:smoke` (or for small changes, just `npm run test:unit`)

#### Creating Tests for New Code
1. Translation logic -> `test/unit/core/<name>.vitest.ts` (tag: `@core:<name>`)
2. Service wrapper -> `test/unit/services/<name>.vitest.ts` (tag: `@service:<name>`)
3. Component behavior -> `test/integration/<Name>.integration.vitest.ts` (tag: `@integration`)
4. Full-page flow -> `test/e2e/<name>.spec.ts` (tag: `@smoke`, `@critical`, or `@regression` depending on criticality)
5. Visual appearance -> add `@visual` tag and `toHaveScreenshot()` assertion

#### Adding to the Fixture Repo
- New language constructs go in `test/fixtures/repos/language-features/<feature>.tsx`
- Cross-file scenarios go in `test/fixtures/repos/cross-refs/`
- Run `npm run test:unit` after adding fixture files to verify they parse correctly

#### Debugging Test Failures
- Unit test fails: `npx vitest test/unit/<path> --reporter verbose` for full output
- Playwright fails: `npx playwright test --reporter list --debug` for interactive debugging
- Visual regression: check `test-results/` for screenshot diffs
- Flaky Playwright test: add `@quarantine` tag and file an issue

### Lint
Always run a lint to check for syntax and type errors. Generally the solution to the type error is to fix the type or fix the call, not to bypass typechecking or make things options
npx tsc --noEmit

### Translation principle
Keep it as simple as possible. Lua, the language, only has variables, tables, and functions. I want to represent typescript as close to this as possible
