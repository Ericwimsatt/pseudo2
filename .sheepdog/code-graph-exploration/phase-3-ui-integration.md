# Phase 3: UI Integration

## Goal
Add a "Code Graph" tab to the application with:
- Header button to open graph tab
- Sidebar navigation item
- Full-screen graph canvas with Cytoscape.js
- Toolbar for layout, filter, and actions
- Node selection → details panel

## Components to Create

### 1. Header Button (`src/App/components/Header.tsx`)
```tsx
// Add to existing header toolbar
<Button 
  variant="ghost" 
  onClick={() => navigateToTab('code-graph')}
  title="Open Code Graph (Ctrl+Shift+G)"
>
  <GraphIcon size={18} />
  <span className="hidden sm:inline">Code Graph</span>
</Button>
```

### 2. Sidebar Item (`src/App/components/Sidebar.tsx`)
```tsx
// Add to sidebar navigation
<NavItem 
  id="code-graph" 
  label="Code Graph" 
  icon={GraphIcon}
  onClick={() => navigateToTab('code-graph')}
  badge={graphStats?.nodeCount}
/>
```

### 3. Graph Tab (`src/App/components/CodeGraphTab.tsx`)
```tsx
// Main tab component - full screen layout
<div className="flex h-full flex-col">
  <GraphToolbar />           // Fixed top toolbar
  <div className="flex-1 flex overflow-hidden">
    <GraphCanvas />          // Cytoscape canvas (flex-1)
    <GraphDetailsPanel />    // Right sidebar (w-80, collapsible)
  </div>
</div>
```

### 4. Graph Toolbar (`src/App/components/GraphToolbar.tsx`)
```tsx
// Controls:
// - Layout selector: force | hierarchical | circular | preset
// - Filter: node type checkboxes (function, class, import, etc.)
// - Edge type toggles: call, import, extends, references
// - Search: filter nodes by name (debounced)
// - Actions: Rebuild graph, Run min-cut, Export, Screenshot
// - Zoom controls: fit, zoom in/out, reset
```

### 5. Graph Canvas (`src/App/components/GraphCanvas.tsx`)
```tsx
// Cytoscape.js wrapper
import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose'  // force-directed
import dagre from 'cytoscape-dagre'  // hierarchical

// Styles from src/App/graphStyles.ts
// - Node: color by type, size by degree
// - Edge: width by weight, color by type, curve for hierarchical
// - Modules: background colored regions (compound nodes or overlay)

// Events:
// - tap node → selectNode(nodeId)
// - tap background → clearSelection()
// - box selection → selectMultiple(nodeIds)
// - layout complete → onLayoutDone()
```

### 6. Details Panel (`src/App/components/GraphDetailsPanel.tsx`)
```tsx
// Collapsible right panel (default open)
// Tabs: Details | Callers | Callees | Source | Metrics
// - Details: node metadata, file, line, type
// - Callers: paginated list with "go to" links
// - Callees: same
// - Source: inline code snippet (from AST)
// - Metrics: degree, betweenness, clustering, coupling
```

## Cytoscape Styles (`src/App/graphStyles.ts`)
```typescript
export const cytoscapeStyles = [
  // Nodes
  { selector: 'node', style: { 'background-color': '#6366f1', 'label': 'data(label)', 'font-size': '10px' } },
  { selector: 'node[type="function"]', style: { 'background-color': '#22c55e', 'shape': 'ellipse' } },
  { selector: 'node[type="class"]', style: { 'background-color': '#3b82f6', 'shape': 'rectangle' } },
  { selector: 'node[type="import"]', style: { 'background-color': '#f59e0b', 'shape': 'triangle' } },
  
  // Selected
  { selector: 'node:selected', style: { 'border-width': 3, 'border-color': '#ef4444', 'z-index': 999 } },
  
  // Edges
  { selector: 'edge', style: { 'width': 'mapData(weight, 1, 10, 1, 4)', 'line-color': '#94a3b8', 'curve-style': 'bezier', 'target-arrow-shape': 'triangle', 'target-arrow-color': '#94a3b8' } },
  { selector: 'edge[type="call"]', style: { 'line-color': '#22c55e' } },
  { selector: 'edge[type="import"]', style: { 'line-color': '#3b82f6', 'line-style': 'dashed' } },
  
  // Modules (compound or overlay)
  { selector: '.module-boundary', style: { 'background-color': 'rgba(99, 102, 241, 0.1)', 'border-width': 2, 'border-color': '#6366f1', 'border-style': 'dashed' } },
  
  // Cut edges
  { selector: '.cut-edge', style: { 'line-color': '#ef4444', 'line-style': 'dotted', 'width': 3, 'target-arrow-color': '#ef4444' } }
]
```

## App Integration

### Router/Tab State (`src/App/App.tsx`)
```tsx
// Add to tab state
type TabId = 'editor' | 'code-graph' | 'settings'
// ...
const [activeTab, setActiveTab] = useState<TabId>('editor')

// Render tab content
{activeTab === 'code-graph' && <CodeGraphTab />}
```

### Keyboard Shortcut
```tsx
// In App.tsx or useHotkeys
useHotkeys('mod+shift+g', () => setActiveTab('code-graph'))
```

## Data Flow
```
User clicks "Code Graph" 
  → CodeGraphTab mounts
  → useEffect: invoke 'graph:build' 
  → IPC progress events → update toolbar progress
  → 'graph:built' → receive stats → render GraphCanvas with nodes/edges
  → User interacts → select node → DetailsPanel shows query results
  → User clicks "Run Min-Cut" → invoke 'graph:mincut' → update canvas with modules
```

## Verification
- `npm run test:typecheck` passes
- `npm run test:lint` passes  
- `npx vitest run` passes
- `npx playwright test test/e2e/code-graph.spec.ts` passes
- Manual: Click header button → tab opens → graph builds → can pan/zoom/click nodes