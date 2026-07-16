# deepPlan — Project Plan

## Vision

An Electron app that helps novice coders and vibe coders understand TypeScript/TSX code by rendering it as human-readable English. It shows source code on the left and a "pseudocode" translation on the right, with synced scrolling, visual nesting to show parent/child relationships, and hover tooltips explaining React functions, JSX elements, and Tailwind classes.

---

## Tech Stack

- **Bundler**: electron-vite
- **Language**: TypeScript + React (TSX)
- **Syntax highlighting**: shiki
- **Popups / tooltips**: @floating-ui/react
- **Testing**: Playwright
- **AST**: TypeScript Compiler API (native `ts.createSourceFile`)

## Dependencies

```
npm create @quick-start/electron-vite     # or equivalent electron-vite scaffolding
npm install typescript shiki @floating-ui/react
npm install -D playwright @playwright/test
```

---

## Translation Examples

These are the target tone and style for translating TypeScript into English. The goal is verbose, natural, human-readable English — not simplified code.

| # | Source | Translation |
|---|--------|-------------|
| 1 | `const [count, setCount] = useState(0)` | "state variable'count' starts at 0. Call 'setCount' to update it" |
| 2 | `const [items, setItems] = useState<Item[]>([])` | "state variable 'items' is a list of Items, starting empty. Call 'setItems' to update it" |
| 3 | `import React, { useState } from 'react'` | "Import {React useState} from the 'react' library" |
| 4 | `export default function App() { ... }` | "Export 'App' so other files can import it" |
| 5 | `const doubled = useMemo(() => count * 2, [count])` | "doubled = count * 2. only recalculate when 'count' changes|
| 6 | `useEffect(() => { fetchData() }, [])` | "Run 'fetchData' once when this component first appears on screen" |
| 7 | `return <div className="flex items-center">{children}</div>` | "Render a container. styled: flexibly arranges items, centers items.\n |__contains 'children'" |
| 8 | `items.map(item => <Card key={item.id} data={item} />)` | "For each 'item' in 'items'\n,|__ render a 'Card' component with key{item.id} and data{item} |
| 9 | `if (isLoading) return <Spinner />` | "If isLoading\n |__show a Spinner indicator" |
| 10 | `onClick={() => setCount(prev => prev + 1)}` | "When clicked, call setCount param:{\n |_ result of function params{prev}: \n \t|_ return prev + 1"} |
| 11 | `const handleSubmit = async (e: FormEvent, user: string) => { ... }` | " asynchronous function 'handleSubmit' takes params {e (is a FormEvent) user (is a string),}" |
| 12 | `return condition ? <Success /> : <Error />` | "render\n |_ If condition is true\n \t|__ 'Success' component; \n otherwise\n |_ render an 'Error' component" |
| 13 | `<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">` | "<button> styled: bold blue,  white text, padding, rounded corners, darkens when hovered" |
| 14 | `interface Props { name: string; age?: number }` | "type 'Props' \n|_ required: 'name' is a string (required ),\n|_ 'age' is a number (optional)'" |
| 15 | `const { data, error } = useSWR('/api/user', fetcher)` | data, error are the result of calling useSWR with params {'/api/user', fetcher}
| 16 | `type Color = 'red' \| 'blue' \| 'green'` | "type 'Color' is 'red' or  'blue', or 'green'" |
| 17 | `<MyComponent title="Hello" count={5} />` | "<'MyComponent'> \n|_title 'Hello'; \n|_count 5" |
| 18 | `const name = props?.user?.profile?.name ?? 'Anonymous'` | "name is props.user.profile.name if it exists or anonymous" |

---

## Architecture Overview

```
src/
├── components/
│   ├── landing/          # Folder picker, saved-preferences loading
│   ├── nodes/            # One React component per DisplayNodeKind
│   │   ├── jsxNodes/     # JSX-specific node variants
│   │   └── popups/       # Hover tooltip infrastructure + dictionaries
│   ├── fileNavigator.tsx # VSCode-style collapsible sidebar
│   └── splitTable.tsx    # Side-by-side source + translation with synced scroll
├── workers/
│   ├── generateAst.ts    # One-liner: ts.createSourceFile(...)
│   ├── astToRenderable.ts# Maps every TS AST node kind to a DisplayNodeKind, groups similar nodes, computes depth, tracks source-line mapping
│   └── translate.ts      # Produces the final viewmodel array from the renderable AST
├── tests/                # Playwright tests
├── App.tsx               # Main React app (creates this file)
├── electron-main.ts      # Minimal Electron main process (IPC for filesystem)
└── electron-preload.ts   # Preload script exposing safe IPC APIs to renderer
```

### Data Flow

```
TSX File on disk
  → electron-main (reads file via IPC)
    → generateAst (ts.createSourceFile)
      → astToRenderable (classify, group, depth, source-line mapping)
        → translate (render English string for each line)
          → ViewModel array posted to renderer
            → splitTable renders left (shiki source) and right (Node components)
```

### ViewModel Shape

```ts
type ViewModelLine = {
  sourceLine: number;        // 1-indexed source line
  translationLine: number;   // 1-indexed translation line
  depth: number;             // 0 = top-level, 1 = inside a function, 2 = nested function, etc.
  sourceNodes: NodeDef[];    // AST-derived nodes for the source column (feed into shiki)
  translationNodes: NodeDef[]; // AST-derived nodes for the translation column
};

type NodeDef = {
  kind: DisplayNodeKind;
  text: string;
  decorations: Decoration[];   // e.g. "collapsible"
  tooltipKey?: string;        // key into a popup dictionary, if hoverable
};
```

---

## Implementation Phases

### Phase 1 — Scaffolding
**Depends on:** nothing

- Run `npm create @quick-start/electron-vite` (or preferred electron-vite starter) to get a working Electron + Vite + React shell
- Verify the app opens an Electron window rendering a blank React page
- Create `App.tsx` as the root component (empty for now)
- Create `electron-main.ts` with minimal IPC: `readFile`, `readDir` (keep it barebones)
- Create `electron-preload.ts` exposing those IPC methods safely
- Create `.vscode/launch.json` with a single command to launch electron + vite
- Test: running the launch config opens the app with no errors

### Phase 2 — Landing & File Navigation
**Depends on:** Phase 1

- Implement `landing/folder_loader.tsx`:
  - "Open Folder" button that opens native folder picker dialog (via IPC)
  - Save chosen folder path to LocalStorage; reload on next session
- Implement `fileNavigator.tsx`:
  - Collapsible sidebar (VSCode-inspired)
  - Reads directory tree from electron IPC
  - Clicking a `.ts` / `.tsx` file triggers loading it (Phase 4 will consume this)
  - For non-.ts/.tsx files, translation column shows "Translation not available for this file type"
- Test with Playwright: open a real project folder, verify the sidebar shows the file tree

### Phase 3 — AST Generation Worker
**Depends on:** Phase 1

- Create `workers/generateAst.ts`:
  - One-liner using `ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true)`
  - Export as a web worker or run in a separate thread
- Create `workers/astToViewModel.ts`:
  - Contains a mapping of **every** TypeScript `SyntaxKind` to a `DisplayNodeKind`:
    - `FunctionDeclaration`, `ArrowFunction`, `MethodDeclaration`, `ConstructorDeclaration` → `"function"`
    - `VariableDeclaration`, `BindingElement` → `"variable"`
    - `IfStatement`, `ConditionalExpression` → `"condition"`
    - `ForStatement`, `WhileStatement`, `ForOfStatement`, `ForInStatement` → `"loop"`
    - `JsxElement`, `JsxSelfClosingElement` → `"jsx"`
    - `CallExpression` where callee is a React hook → `"hook"`
    - `CallExpression` (other) → `"call"`
    - `ImportDeclaration` → `"import"`
    - `ExportAssignment`, `ExportDeclaration` → `"export"`
    - `InterfaceDeclaration`, `TypeAliasDeclaration` → `"type"`
    - `ReturnStatement` → `"value"`
    - `StringLiteral`, `NumericLiteral`, `TrueKeyword`, `FalseKeyword`, `NullKeyword` → `"value"`
    - `BinaryExpression`, `PrefixUnaryExpression`, `PostfixUnaryExpression` → `"operator"`
    - support some special cases that aren't in the AST: UseState, UseEffect
    - (etc. — every SyntaxKind must be covered)
  - Group trimmed AST nodes by line using source positions
  - Compute depth (0 = top-level, increments inside each block/closure)
  - Track source-line-to-translation-line mapping
  - Handle JSX separately: enter "Render" mode, translate map/iterations/conditionals/keywords within JSX. Create a similar mapping system as DisplayNodeKind for JSX `JSXDisplayNodeKind`

- Take the renderable AST and produces the ViewModel array: [
{
source: {(returned from shiki library, with syntax highlighting)},
translation: {displayNodeProps[]}
}
]
- Use the translation examples above as the style guide
- Log the full ViewModel to console when complete, including source code and AST nodes per line
  

### Phase 4 — Split Table
**Depends on:** Phase 3

- Implement `splitTable.tsx`:
  - Left column: source code rendered with shiki syntax highlighting
  - Right column: translation rendered as a series of `<span>` Node components
  - Synced scrolling: both columns scroll together so the same line is always aligned
  - Draggable divider to resize columns
  - Row background: JSX lines within a function get a slightly different background color
  - Lines render incrementally as translation completes (source appears first, translation fills in)
  - `collapsible` decoration: clicking `[-]` icon collapses/expands child lines in both columns. Only visible/active if a node in the line has the 'collapsible' decorator

### Phase 5 — Node Components & Tree Lines
**Depends on:** Phase 3, Phase 4

- Create one React component per `DisplayNodeKind` in `components/nodes/`:
  - Each renders as a `<span>` so nodes can sit inline
  - Each accepts the `props` interface from `node.tsx`
  - Colors of nodes should line up with the colors provided by the shiki syntax highlighting
- Implement tree-line visual nesting:
  - Each line is a `<div class="scope-line">`
  - Uses `border-left` to draw the vertical scope line
  - Ends with a rounded corner `╰` into each child
  - Depth controls indentation and line drawing
  - Example visual:
    ```
    function(...)
    ╰──── useState(...)
    ╰──── useState(...)
    ╰──── if(...)
          ╰──── render(...)
          ╰──── return
    ```
- For JSX nodes: prepend "Render" when entering JSX context, use special JSX node variants

### Phase 6 — Popups & Tooltips
**Depends on:** Phase 5

- Implement `nonInteractiveTooltip.tsx` using `@floating-ui/react`:
  - Generic tooltip component used by all nodes
  - Shows on hover, disappears on mouse leave
  - Pulls content from dictionary files
- Create dictionary files in `components/nodes/popups/dictionaries/`:
  - `reactFunctionsToolTips.tsx` — useState, useMemo, useContext, useEffect, useCallback, useRef, useReducer (summary → in-depth → docs link)
  - `jsxHeaders.tsx` — explanations of common JSX elements (<div>, <span>, <button>, <input>, <form>, etc.)
  - `tailwindToolTips.tsx` — mapping of 100 most common Tailwind classes to 3-4 word explanation + CSS property name (e.g. `"flex"` → `"Flexible layout / display: flex"`)
- Share popup logic across components; minimize duplicated code
- Playwright tests: open a file with React hooks + Tailwind, hover over nodes, verify tooltips appear and disappear

### Phase 7 — Final Testing & Polish
**Depends on:** All phases

- Write Playwright end-to-end tests:
  - Load a folder → file tree populates
  - Click a .tsx file → source appears with syntax highlighting → translation fills in
  - Hover over useState → tooltip appears
  - Collapse a function → children hide in both columns
  - Scroll synced between columns
  - Drag divider to resize
  - Non-.tsx files show "translation not available"
- Take screenshots at each step to verify visual appearance
- Run the app from a port other than 5173 (5173 is reserved for human-run instances)
- Open the app and interact manually to confirm everything works
- Ensure `launch.json` starts the app with one command, no errors

---

## General Rules

- After every change, run the app and test the new behavior from multiple angles
- If behavior doesn't work, fix it and retest
- If unrelated functionality breaks, isolate the change or flag it as a pre-existing bug
- Each worker goes in its own file
- Delete per-directory todo.md files when that phase is complete
- Use port 5174 (or any port except 5173)
