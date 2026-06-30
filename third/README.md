# Source Narrator

A local web application for exploring source code through alternate
English representations. Open a local repository, browse its files,
and read each one as a sequence of plain-English sentences derived
from a language-independent semantic graph.

The application is a developer tool. The first supported language is
TypeScript. The architecture is designed to make additional languages
drop-in: the English renderer consumes only a Semantic IR and never
sees language-specific syntax.

## High-level architecture

```
React (Presentation)
   ↓
Controllers (orchestration)
   ↓
Domain (Repository, SourceFile, SemanticGraph, ...)
   ↓
Language (TypeScript parser, AST visitors, adapters)
   ↓
Infrastructure (FileSystem, repository loading, caching)
```

The translation pipeline for one file is:

```
Repository → SourceFile → TypeScript parser → TypeScript AST
          → Semantic builder → SemanticGraph → English renderer → EnglishLine[]
```

The Semantic IR is the source of truth for the renderer. The
renderer never imports from a language package.

## Workspace layout

```
packages/
  app/                  Vite + React + TypeScript + Tailwind
    src/
      components/       layout, sidebar, english, devtools, icons
      panels/           SourcePanel, AstPanel, SemanticPanel,
                        EnglishView, Inspector, DiagnosticsPanel,
                        LogsPanel, PerformancePanel
      controllers/      Repository, Navigation, Translation, Inspector
      hooks/            use-controller-bindings, sample-files
      infrastructure/   FileSystem, FS access, drop, memory, loader
      store/            Zustand store
      App.tsx
  translator-core/      semantic IR + English renderer
    src/
      semantic/         nodes, relationships, metadata, semantic-graph
      model/            Repository, SourceFile, LanguageService
      renderers/english English renderer, renderer registry
      visitors/         semantic visitor
  language-typescript/  TypeScript parser, adapters, symbols, service
  shared/               common types, events (bus, selection), utils
```

## Getting started

Install dependencies (npm workspaces):

```
npm install
```

Start the dev server:

```
npm run dev
```

The app opens with no repository loaded. Use the **Load sample**
button to populate a small in-memory repository, or **Open
repository** to grant access to a real local folder via the File
System Access API (Chromium browsers). You can also drag and drop a
folder onto the window.

## Commands

- `npm run dev`      — start Vite dev server
- `npm run build`    — type-check and build all packages
- `npm run typecheck`— run `tsc --noEmit` in every package

## Pipeline status

The TypeScript parser, AST, semantic adapter, and English renderer
are all in place and wired into the pipeline. The current semantic
adapter produces a placeholder "unknown" node per top-level AST
child so the Inspector and Semantic panels have something to display
while the real adapter is filled in. End-to-end:

```
Repository loading started
Repository loaded { files: 5, languages: [typescript] }
Translated src/parser/parser.ts { astNodes: 83, semanticNodes: 5, englishLines: 5 }
```

## Testing

A headless smoke test exercises the full pipeline against the sample
data:

```
npx tsx packages/app/scripts/smoke-test.ts
```

## Adding a new language

1. Create a new package, e.g. `packages/language-python`.
2. Implement a `LanguageService` that uses the language's parser to
   build a `ParseTree`, then produces a `SemanticGraph` of language-
   independent nodes.
3. Register the service with the AppController
   (`createAppController({ languageServices: [...] })`).
4. The English renderer will pick up the new language automatically
   — no renderer changes are required.
