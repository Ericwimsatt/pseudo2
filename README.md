# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Fragment Inspection

An CLI tool for inspecting canonical HTML fragments without launching Electron:

```bash
npx tsx scripts/inspect-fragment.ts <project-path> <file-path> [--html] [--tooltip] [--sidebar]
```

Options:
- `--html` — print raw HTML without metadata wrapper
- `--tooltip` — render tooltip fragment for the given file instead of the file table
- `--sidebar` — render sidebar fragment for the project tree

The tool initializes the same services as production, renders the canonical fragment via the pure renderers, and prints the result. It accepts fixture repository paths and does not require a visible Electron window.

Example:
```bash
npx tsx scripts/inspect-fragment.ts test/fixtures/repos/language-features Functions.tsx --html
```
