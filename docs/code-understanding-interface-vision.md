# Code Understanding Interface Vision

PseudoTranslator should treat hover as the entrance to a broader code-understanding system, not as a container for every available detail. The interface should let someone move from a quick explanation to deeper investigation without losing their place in the code.

## Core interaction model

The recommended experience has three depths:

1. **Preview:** Hovering or focusing a meaningful symbol shows a concise, interactive explanation of what it is, what it does here, and one important consequence. The preview remains open while the pointer or keyboard focus is inside it and may contain a small set of relevant actions.
2. **Inspect:** Clicking the symbol or choosing **Keep open** inserts a full-width inspection strip beneath the associated code. This anchored view can explain uses, relationships, and change impact while preserving the surrounding source and translation.
3. **Explore:** Actions such as **Open graph**, **Read concept note**, or **Plan a change** open an Understanding Canvas with enough space for graphs, Markdown, examples, and other media. Returning restores the exact file, symbol, view, and scroll position.

The inline anchored inspector should be the default organization. A docked inspector can be offered for repeated expert browsing, while the canvas is reserved for investigations that genuinely need more space.

## Navigation principles

Navigation has three independent dimensions:

- **Depth:** preview → anchored inspection → understanding canvas
- **Position:** previous or next meaningful concept in source order
- **Relationship:** dependency, use, caller, result, owner, type, or rendered output

These dimensions should never be conflated:

- **Escape** reduces depth without changing the selected concept: canvas → anchored inspection → code.
- **Back and Forward** traverse deliberate investigation history and restore the complete prior state. Transient hovers do not create history entries.
- **Breadcrumbs** return to conceptual parents such as `Counter.tsx › count › Uses › doubled`.
- **Previous/Next concept** moves laterally through meaningful symbols in code order while keeping the current inspection depth.
- **Relationship links** move laterally by meaning, with explicit labels such as **Changed by setCount** or **Used to calculate doubled**.

A compact recent-concepts trail can show the last few deliberate selections, for example `count → doubled → button → Counter`. It supplements history rather than replacing Back and Forward.

## Representation and technical detail

How code is represented and how much technical detail is shown should be separate controls:

- **Representation:** Source · Together · Simplified
- **Technical detail:** Essential · Guided · Exact

This allows combinations such as source-only, translation-only, side-by-side comparison, or a simplified translation containing no type terminology. **Essential** should genuinely remove types and type-system language; **Guided** may explain the concept in approachable terms; **Exact** may show the precise TypeScript type and related technical details.

These settings should persist while moving between concepts and depths, but changing them should not clutter investigation history.

## Context-aware explanations

The first useful answer depends on the selected concept:

- **Variable or state:** what the value represents, where it comes from, and where it changes
- **Function:** purpose, inputs, result, side effects, callers, and change impact
- **Component:** what it renders, what controls it, and where it is used
- **Type:** allowed values in plain language, examples, constraints, and affected code
- **Import:** why the file needs it and whether it is local or external
- **Conditional:** what decision is being made and which paths it creates

The preview should prioritize the most relevant answer rather than presenting the same generic sections for every symbol. Richer reference lists, graphs, and change analysis belong in the anchored inspector or canvas.

## State restoration

Every deliberate navigation state should be able to preserve:

- File, line, and selected symbol
- Source scroll position
- Current depth and inspector section
- Source/Simplified/Together setting
- Essential/Guided/Exact setting
- Selected graph node or document section, when relevant

The governing principle is: **never discard context when changing depth, and never change depth accidentally when changing concepts.**

## Initial implementation direction

Start with the preview-to-inline-anchor transition and reliable state restoration. Then add previous/next concept navigation and semantic relationship links. Treat the Understanding Canvas and richer media as the next layer built on the same navigation state, rather than as a separate feature with its own navigation model.
