# AGENTS.md

Working notes for agents (and humans) working in this codebase.

## What this is

A local web application that opens a repository, parses each file
into a language AST, converts that into a language-independent
Semantic IR, and renders the IR as English sentences.

The TypeScript language is implemented. Other languages can be
added without changing the renderer — that is the core invariant.

## Run it

```
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run typecheck  # tsc --noEmit in every package
npm run build      # type-check + production build
```

A headless smoke test exercises the full pipeline against the
in-memory sample repository:

```
npx tsx packages/app/scripts/smoke-test.ts
```

## Architecture rules (do not break)

1. **The English renderer must never import from a language package.**
   The renderer is a pure function `SemanticGraph → EnglishLine[]`.
   The only language package it may transitively depend on is
   `@source-narrator/shared` (branded types) and
   `@source-narrator/translator-core` (semantic types).
2. **React components must not call language services directly.**
   Components subscribe to the store and call controller methods
   (`controller.navigation.*`, `controller.translation.*`).
3. **Controllers are the only orchestration layer.** They coordinate
   between the Infrastructure, Domain, and Language layers. They own
   no UI logic.
4. **Domain types are immutable.** Replace via spread, not mutation.
5. **Panels read from the store; they do not own caches.** The
   Repository (model) owns derived caches; the store mirrors them
   into React state.

## Where to add things

| Change | File(s) |
| ------ | ------- |
| New language | New `packages/language-*` package implementing `LanguageService` |
| Better adapter for a statement kind | `packages/language-typescript/src/adapters/statements/<kind>.ts`, register in `statement-dispatcher.ts` |
| Better adapter for an expression kind | `packages/language-typescript/src/adapters/expression-adapter.ts` |
| Better English | `packages/translator-core/src/renderers/english/english-renderer.ts` |
| New panel | `packages/app/src/panels/<Name>/<name>-panel.tsx`, register in `components/devtools/dev-tabs.tsx` |
| New controller | `packages/app/src/controllers/<name>-controller.ts`, add to `AppController` in `app-controller.ts` |
| New event | `packages/app/src/controllers/events.ts` `AppEventMap` |
| New store slice | `packages/app/src/store/app-store.ts` |

## Conventions

- **File size**: keep files under ~300 lines where reasonable.
- **Module shape**: every module exports a single primary symbol
  (factory function or class) plus types. Avoid giant object
  literals.
- **Logging**: route all messages through the AppController's
  logger, not `console.log`. The Logs panel is the primary
  debugging surface.
- **Perf**: any non-trivial work should be measured with
  `controller.perf.start(label)` or `controller.perf.record(...)`.
  The Performance panel will surface them.
- **Diagnostics**: use `appendDiagnostic` for parser warnings,
  renderer warnings, etc. The Diagnostics panel consumes them.

## Pipeline state

- ✅ Repository loader (FS access API, drag-drop, in-memory)
- ✅ TypeScript parser (AST built with the official TypeScript
  compiler API)
- ✅ Semantic adapter — TypeScript AST → language-independent
  `SemanticGraph`. Dispatches by `ts.SyntaxKind` to per-kind
  adapters in `packages/language-typescript/src/adapters/`:
  - `helpers.ts` — context, id generation, name extraction
  - `statement-dispatcher.ts` — central dispatch
  - `expression-adapter.ts` — calls, assignments, literals
  - `statements/declarations.ts` — function, class, interface, type-alias, enum
  - `statements/control-flow.ts` — if, loops, return, throw, try, switch, break, continue
  - `statements/variable.ts` — variable statement, expression statement
  - `statements/import-export.ts` — import, export
- ✅ English renderer — produces one natural sentence per node,
  with paragraph grouping. `packages/translator-core/src/renderers/english/`
- ✅ Inspector, Source, AST, Semantic, English, Diagnostics, Logs,
  Performance panels
- ✅ Selection sync across panels via the navigation controller

### Example output

For `src/main.ts`:

```
The binding parseExpression is imported from "./parser/parser".
The binding renderEnglish is imported from "./renderer/english".
The binding tokenize is imported from "./parser/tokenize".
A value is assigned to tokens.
  The function tokenize is called with 1 argument.
A value is assigned to value.
  The function parseExpression is called with 1 argument.
A value is assigned to english.
  The function renderEnglish is called with 1 argument.
The function log is called with no arguments.
```

## Common pitfalls

- The `EnglishLine` type is defined in
  `packages/translator-core/src/renderers/english/english-line.ts`
  and re-exported through the model. Do not redefine it elsewhere.
- The Repository is the only owner of derived caches. Don't store
  AST/Semantic/English in components.
- `typescript` is a heavy dependency (~3.7MB gz). It's included in
  the bundle; if it becomes a problem, move the parser into a Web
  Worker.
- Adapters must import from `../helpers.js` (in
  `language-typescript/src/adapters/`), not from sibling files in
  `statements/`. The `helpers` module is the only place that knows
  how to construct SemanticNodes.
- The dispatcher (`statement-dispatcher.ts`) and the per-kind
  adapters in `statements/` are mutually recursive. Keep imports
  one-way: dispatcher imports statements, statements import
  dispatcher via the `adaptBlockBody` helper. Don't add new
  bidirectional dependencies.
