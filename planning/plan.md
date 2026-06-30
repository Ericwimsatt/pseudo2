
“Develop a VS Code extension using TypeScript where each .ts file has a custom alternate editor that reads closer to plain english than the original code. Its intended audience is non-technical folks who have a lot of experience creating software with AI. In extension.ts, register a CustomTextEditorProvider for TypeScript files. In the provider (PseudoEditorProvider), implement resolveCustomEditor to parse the file’s AST using the TS compiler API and produce plain-Pseudo descriptions. Create a webview panel (vscode.window.createWebviewPanel) with enableScripts: true and load a React/Tailwind app into it. The React app should render the Pseudo lines using a reusable Line component. Set up message passing: extension sends data via postMessage, React listens with acquireVsCodeApi(). Organize code into small modules: controllers (translator), providers, and shared React components. Use VSCode docs for guidance (Custom Editor API and Webview API).”
You will need to use VSCode extension APIs. Please wrap these (maybe in hook, not sure what's normal here). I am a very skilled React developer, and a much less skilled VSCode developer, I would like to be able to not think about VSCode extension usage the same way I don't worry about backend implementation unless I go look for it. Include links to relevant VSCode docs where these are used.

Use this file structure:
pseudo/
├─ package.json                  
│   ├─ contributes.views        # viewType registration for custom editor
│   └─ activationEvents: ["onLanguage:typescript", "onCommand:openPseudo"]
├─ src/
│   ├─ extension.ts             # registers CustomEditorProvider (and optional command for toggling view)
│   ├─ controllers/             
│   │   └─ PseudoTranslator.ts # TS AST parsing → Pseudo mappings
│   ├─ providers/
│   │   └─ PseudoEditorProvider.ts  # handles openCustomDocument & resolveCustomEditor
│   ├─ view/                    
│   │   ├─ reactApp/            # React (TSX) + Tailwind UI 
│   │   │   ├─ components/      # includes `<Line>` component etc.
│   │   │   ├─ App.tsx
│   │   │   └─ index.css
│   └─ utils/                   
│       └─ vscodeHooks.ts       # wrappers/hooks for messaging if needed
└─ out/                         

Data Flow : When a TS file is opened, PseudoEditorProvider.resolveCustomEditor is invoked. It uses PseudoTranslator to parse and convert the AST. The webview (React) is created via createWebviewPanel (with enableScripts: true). The extension sends the Pseudo lines via postMessage, and the React app renders them in the custom editor. Future features (like variable usage tracking) can be managed by additional controller modules hooking into editor events.
