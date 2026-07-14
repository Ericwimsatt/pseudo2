tracking what's been rendered in the translator should not be necessary (currently renderedLines Set in translationDictionary) (Also isJsxInsideReturn)


Reduce steps--Make HTML/react directly from the tree. Building the view model should not be an extra step

Step 5 — IPC return (electron-main.ts:97) ships {sourceCode, translationsByLine, semanticNodes} to the renderer. translationsByLine is a Record<number, TranslationItem[]> where each item carries text and endLine for multi-line spans.
Step 6 — buildViewModel (lib/renderable/viewModel.ts) flattens the tree, re-tokenizes, and builds one LineRenderable per source line. applyRowSpans (:35) gives the multi-line interface block (lines 3-8) a single translation cell with translationRowSpan and marks lines 4-7 skipTranslation, so the side-by-side table stays aligned.