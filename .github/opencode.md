# PseudoTranslator Agent Instructions

## Core commands
- Typecheck: `npx tsc --noEmit`
- Lint: `npx oxlint`
- Unit tests: `npx vitest test/unit/<path>`
- Smoke tests: `npx playwright test --grep @smoke`
- Full check: `npm run test:typecheck && npm run test:lint && npm run test:unit && npm run test:smoke`

## Test rules
- New translation logic -> vitest unit test in test/unit/core/
- New UI component -> integration test in test/integration/ + Playwright smoke test
- Always run test:typecheck + test:lint + test:unit before submitting
- Screenshot tests are @visual - only update baselines with human approval
- Known-flaky tests get @quarantine tag

## Repo fixture
- language-features: one file per construct category
- cross-refs: multi-file project with imports/exports
- Add new .ts/.tsx files to the fixture repo to cover new language constructs
