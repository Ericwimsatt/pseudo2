# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user has already made a few applications but is not a classically trained software engineer. They may have started by vibe coding and are now becoming more involved in understanding, evaluating, and changing the code behind what they build.

## Product Purpose

PseudoTranslator makes code easier to understand. It helps people move from relying on generated code to developing a clearer mental model of how their software works.

Success means increasingly complex software concepts can be explained in increasingly simple and accessible terms, without requiring a traditional computer-science background.

## Positioning

PseudoTranslator turns a real, local codebase into simpler representations that remain connected to the underlying files. Its current representation reduces TypeScript and TSX toward variables, tables, and functions; that Lua-like simplicity is a floor for clarity, not a permanent output format or conceptual ceiling.

## Operating Context

The user opens a repository from the local filesystem and explores its files while they may also be editing those files with other tools. Depending only on the filesystem currently lets PseudoTranslator remain aligned with those external edits without introducing a separate source of truth.

The current interface supports repository browsing, side-by-side source and translation, structural nesting, search, navigation, and contextual details for definitions, references, and types.

## Capabilities and Constraints

- The implemented translator currently supports TypeScript and TSX.
- The current translation vocabulary emphasizes simple variables, tables, and functions.
- Local-only operation is important for the present product because it keeps the filesystem as the shared source of truth. It is not an immutable constraint; a future capability may justify networked operation.
- Future representations may include graphs and generated Markdown documents.
- A future conversational capability may answer questions about the code in real time.
- Side-by-side source, the present TypeScript scope, and the current terminology are implementation choices rather than must-preserve product constraints.
- Future explanations should become simpler and more accessible even as the supported concepts become more complex.

## Brand Commitments

The current product name is PseudoTranslator. No additional binding voice, identity, or visual commitments have been established.

## Evidence on Hand

- The working Electron application and its current product copy are in `src/`.
- Translation behavior and renderable representations are implemented in `src/main/translationService/`.
- Repository, navigation, search, hover, tooltip, and rendering behavior are covered by tests in `test/`.
- Language examples used to exercise the translator are in `test/fixtures/repos/language-features/`.
- No testimonials, customer claims, benchmarks, case studies, pricing, or other external proof are currently on hand; future work must not fabricate them.

## Product Principles

1. Make the code understandable before making the explanation comprehensive.
2. Meet self-taught and emerging developers where they are, without assuming formal training.
3. Use the simplest representation that preserves the concept the user needs to understand.
4. Stay connected to the user's real, actively changing project rather than creating a detached explanation.
5. Treat today's TypeScript translation as one path toward understanding, not as the final shape of the product.

## Accessibility & Inclusion

The product should make software concepts accessible to people without a traditional engineering education. No specific conformance standard or additional product-specific accessibility requirement has been established yet.
