# Phase 4: CI + Visual Regression + Agent Ergonomics

## Objective
Set up automated CI that enforces the testing layers, add visual regression testing to catch unintended visual changes, and document everything so agents can self-serve without manual guidance.

## Prerequisites
- Phase 1-3 complete: test structure exists, all tests pass
- GitHub repository (if CI is desired)

## Key Architectural Decisions

- CI runs on GitHub Actions (de facto standard for open-source, widely agent-compatible)
- Visual regression uses Playwright's built-in `toHaveScreenshot()` — no third-party service
- Screenshot baselines are checked into version control
- CI has three tiers: fast (push), medium (PR), full (nightly)
- Agent instructions are written to `AGENTS.md` and (optionally) `.github/opencode.md` or `.cursorrules`

## Tasks

### 1. GitHub Actions CI: `.github/workflows/ci.yml`

**Three-tier pipeline:**

```yaml
name: CI

on:
  push:
    branches-ignore: [gh-pages]
  pull_request:
  schedule:
    - cron: '0 6 * * *'  # nightly full suite

jobs:
  static:
    name: Static Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx oxlint
    # Runs on every push — blocks if fails
    # Target: <30s

  unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx vitest run
    # Runs on every push — blocks if fails
    # Target: <10s

  integration:
    name: Integration Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx vitest run --config vitest.integration.config.ts
    # Runs on PR — blocks if fails
    # Target: <30s

  e2e:
    name: E2E Smoke Tests
    runs-on: ubuntu-latest
    needs: [static, unit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx playwright install chromium
      - run: npx playwright test --grep @smoke
    # Runs on every push (fast subset) — blocks if fails
    # Target: <5min

  e2e-full:
    name: E2E Full Regression
    runs-on: ubuntu-latest
    needs: [static, unit]
    if: github.event_name == 'pull_request' || github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx playwright install chromium
      - run: npx playwright test --grep @regression
    # Runs on PR + nightly — non-blocking (informational)

  visual:
    name: Visual Regression
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npx playwright install chromium
      - run: npx playwright test --grep @visual
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: visual-diffs
          path: test-results/
    # Runs on PR — non-blocking. Uploads screenshots on failure for review.
```

### 2. Add Visual Regression Tests

**Update existing screenshot-taking tests to use `toHaveScreenshot`:**

Each spec that currently calls `page.screenshot({ path: ... })` should also assert with `await expect(page).toHaveScreenshot()`.

Create `test/e2e/visual.spec.ts`:
```typescript
import { test } from '../fixtures/base';
import { test } from '@playwright/test';  // or use extended fixture

// Use the language-features repo
// Take full-page screenshots of each major file
// These serve as visual baselines

test('Functions.tsx renders correctly @visual @smoke', async ({ page, languageFeatures }) => {
  await injectFixture(page, languageFeatures);
  await page.goto('http://localhost:5174/#/file/Functions.tsx');
  await expect(page.locator('body')).toContainText('Function');
  await expect(page).toHaveScreenshot('functions.png', {
    fullPage: true,
    animations: 'disabled',
  });
});

test('JSXElements.tsx renders correctly @visual @critical', async ({ page, languageFeatures }) => {
  await injectFixture(page, languageFeatures);
  await page.goto('http://localhost:5174/#/file/JSXElements.tsx');
  await expect(page.locator('body')).toContainText('<div');
  await expect(page).toHaveScreenshot('jsx-elements.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
```

**Visual regression best practices to implement:**
- Mask dynamic content (timestamps, randomly generated IDs) with `mask` option
- Disable animations globally in playwright config: `use: { actionTimeout: 5000 }` and `animations: 'disabled'`
- Use `fullPage: true` for consistent capture
- Start with `threshold: 0.2, maxDiffPixels: 100` and tighten as suite stabilizes
- Run visual tests in Docker (Playwright official image) for pixel-perfect consistency
- Never auto-approve baseline updates in CI — require human PR review

**Create screenshot baseline directory:**
```
test/e2e/snapshots/
  functions.png
  jsx-elements.png
  interfaces.png
  control-flow.png
  classes.png
```

### 3. Add `@quarantine` Tag for Flaky Tests

Create a quarantine run in CI that is non-blocking:
```yaml
  quarantine:
    name: Quarantine (Flaky Tests)
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - run: npx playwright test --grep @quarantine
```

Update AGENTS.md to document that `@quarantine` tests are known-flaky and should be skipped during primary evaluation.

### 4. Document Agent Workflows in AGENTS.md

**Rewrite AGENTS.md with a comprehensive agent section:**

```markdown
## Test Architecture
This project uses a layered test approach:
- **Unit tests** (Vitest): `test/unit/` — pure logic, no browser. Fastest.
- **Integration tests** (Vitest + happy-dom): `test/integration/` — component-level.
- **E2E tests** (Playwright): `test/e2e/` — full browser, slowest.
- **Fixture repos**: `test/fixtures/repos/` — real .ts/.tsx files loaded by tests.

## Available Scripts
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

## Test Tags (Playwright)
- `@smoke` — critical path, run before every commit
- `@critical` — important but not every-commit
- `@regression` — full suite
- `@visual` — screenshot comparison
- `@slow` — takes >30s
- `@quarantine` — known-flaky, skip during eval
- `@ui:{name}` — e.g. `@ui:search`, `@ui:hover`, `@ui:sidebar`
- `@core:{name}` — e.g. `@core:translation`, `@core:rendering`

## Agent Instructions

### Evaluating a Change
1. Always start with the fastest checks: `npm run test:typecheck && npm run test:lint`
2. If changing translation logic: `npx vitest test/unit/core/`
3. If changing a service: `npx vitest test/unit/services/<service-name>.vitest.ts`
4. If changing a UI component: `npx playwright test --grep @ui:<component-name>`
5. Before submitting: `npm run test:smoke` (or for small changes, just `npm run test:unit`)

### Creating Tests for New Code
1. Translation logic → `test/unit/core/<name>.vitest.ts` (tag: `@core:<name>`)
2. Service wrapper → `test/unit/services/<name>.vitest.ts` (tag: `@service:<name>`)
3. Component behavior → `test/integration/<Name>.integration.vitest.ts` (tag: `@integration`)
4. Full-page flow → `test/e2e/<name>.spec.ts` (tag: `@smoke`, `@critical`, or `@regression` depending on criticality)
5. VIsual appearance → add `@visual` tag and `toHaveScreenshot()` assertion

### Adding to the Fixture Repo
- New language constructs go in `test/fixtures/repos/language-features/<feature>.tsx`
- Cross-file scenarios go in `test/fixtures/repos/cross-refs/`
- Run `npm run test:unit` after adding fixture files to verify they parse correctly

### Debugging Test Failures
- Unit test fails: `npx vitest test/unit/<path> --reporter verbose` for full output
- Playwright fails: `npx playwright test --reporter list --debug` for interactive debugging
- Visual regression: check `test-results/` for screenshot diffs
- Flaky Playwright test: add `@quarantine` tag and file an issue
```

### 5. Create `.github/opencode.md` (Agent Context File)

If using opencode, create a project-level agent instructions file:
```markdown
# PseudoTranslator Agent Instructions

## Core commands
- Typecheck: `npx tsc --noEmit`
- Lint: `npx oxlint`
- Unit tests: `npx vitest test/unit/<path>`
- Smoke tests: `npx playwright test --grep @smoke`
- Full check: `npm run test:typecheck && npm run test:lint && npm run test:unit && npm run test:smoke`

## Test rules
- New translation logic → vitest unit test in test/unit/core/
- New UI component → integration test in test/integration/ + Playwright smoke test
- Always run test:typecheck + test:lint + test:unit before submitting
- Screenshot tests are @visual — only update baselines with human approval
- Known-flaky tests get @quarantine tag

## Repo fixture
- language-features: one file per construct category
- cross-refs: multi-file project with imports/exports
- Add new .ts/.tsx files to the fixture repo to cover new language constructs
```

### 6. Add `test-results/` to `.gitignore`

Ensure `test-results/` (Playwright output) and `playwright-report/` are gitignored.

### 7. Add Test Baseline Snapshots to Git

Ensure `test/e2e/snapshots/` is tracked in git (these are the visual baselines).

Add a README in the snapshots directory:
```
# Visual Regression Snapshots
These are baseline screenshots for Playwright toHaveScreenshot() assertions.
Update by running: npx playwright test --grep @visual --update-snapshots
Review ALL changes before committing updated snapshots.
```

### 8. Verify the Full Pipeline

1. Push a branch with changes to the test suite
2. Verify CI runs all tiers:
   - Push: static + unit + e2e-smoke
   - PR: static + unit + integration + e2e-smoke + e2e-full + visual
   - Nightly: static + unit + integration + e2e-full + quarantine
3. Trigger a visual regression failure intentionally → verify artifact upload works
4. Run `npm run test:all` locally → all pass

## Files to Create/Modify

### Create
- `.github/workflows/ci.yml`
- `.github/opencode.md`
- `test/e2e/visual.spec.ts`
- `test/e2e/snapshots/.gitkeep` (and actual baselines after first run)
- `test/e2e/snapshots/README.md`

### Modify
- `AGENTS.md` — rewrite with full agent instructions
- `.gitignore` — add test-results/, playwright-report/

## Success Criteria
- CI runs on every push: static + unit + smoke E2E completes in <8min
- CI runs on every PR: full E2E + visual regression complete in <20min
- Visual regression catches unintended UI changes and uploads artifacts
- Agent instructions are comprehensive enough that a new agent can run the right tests without asking questions
- Any engineer (human or agent) can determine what tests to run for their change in <10 seconds by reading AGENTS.md
