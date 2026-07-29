# Phase 4: Min-Cut Visualization

## Goal
Interactive module boundary detection using min-cut algorithms with:
- Algorithm selection and parameter tuning
- Visual module boundaries on graph
- Cut edge highlighting
- Export partitions for documentation/refactoring

## Components

### 1. Module Boundary Panel (`src/App/components/ModuleBoundaryPanel.tsx`)
```tsx
// Collapsible panel (left or right of canvas)
<Panel title="Module Boundaries" defaultOpen>
  <AlgorithmSelector />
  <ParameterControls />
  <ModuleList />
  <ActionButtons />
</Panel>

// AlgorithmSelector:
// - Stoer-Wagner (global min-cut, recursive bisection)
// - Louvain (community detection, fast, hierarchical)  
// - Leiden (improved Louvain, guaranteed connected)
// - Spectral (Fiedler vector, good for balanced cuts)
// - Custom s-t min-cut (source=entry points, sink=external deps)

// ParameterControls:
// - Min module size (default: 5 nodes)
// - Max modules (default: 20)
// - Resolution (Louvain/Leiden, default: 1.0)
// - Weight threshold (ignore edges below)
// - Balance constraint (max size ratio between modules)

// ModuleList:
// Table: Module ID | Nodes | Edges Internal | Edges Cut | Cohesion | Coupling
// Click row → highlight module on canvas
// Right-click → rename, merge, split, export

// ActionButtons:
// - Run Detection
// - Reset to Default
// - Export Partitions (CSV, GraphML, Markdown)
// - Apply as Folder Structure (future)
```

### 2. Canvas Updates (`src/App/components/GraphCanvas.tsx`)
```tsx
// On partition result:
function applyPartition(partition: PartitionResult) {
  // Option A: Compound nodes (group nodes by module)
  // cy.nodes().forEach(n => n.move({ parent: `module-${partition.partitions[n.id()]}` }))
  
  // Option B: Visual overlay (background colors, borders)
  // Add module background elements
  partition.modules.forEach((nodes, moduleId) => {
    const bb = nodes.reduce((acc, n) => acc.union(n.boundingBox()), cy.collection().boundingBox())
    cy.add({ group: 'nodes', data: { id: `module-bg-${moduleId}`, parent: null }, 
             position: { x: bb.x1, y: bb.y1 }, 
             classes: 'module-boundary',
             style: { width: bb.w, height: bb.h } })
  })
  
  // Highlight cut edges
  partition.cutEdges.forEach(edgeId => {
    cy.getElementById(edgeId).addClass('cut-edge')
  })
  
  // Update legend
  updateLegend(partition)
}
```

### 3. Graph Styles for Modules (`src/App/graphStyles.ts`)
```typescript
// Add to existing styles
{ selector: 'node.module-member', style: { 'border-width': 2, 'border-opacity': 0.8 } },
{ selector: '.module-boundary', style: { 
    'background-color': 'data(moduleColor)', 
    'border-color': 'data(moduleColor)', 
    'border-width': 2, 
    'border-style': 'dashed',
    'opacity': 0.15,
    'z-index': -1
  }
},
{ selector: '.cut-edge', style: { 
    'line-color': '#ef4444', 
    'line-style': 'dotted', 
    'width': 3,
    'target-arrow-color': '#ef4444',
    'target-arrow-shape': 'tee',
    'z-index': 1000
  }
},
{ selector: '.cut-edge:selected', style: { 'line-color': '#fecaca', 'width': 5 } }
```

### 4. Module Legend (`src/App/components/ModuleLegend.tsx`)
```tsx
// Floating or docked legend
<div className="module-legend">
  <h4>Modules ({partition.modules.size})</h4>
  <ul>
    {Array.from(partition.modules.entries()).map(([id, nodes]) => (
      <li key={id} className="legend-item">
        <span className="color-swatch" style={{ backgroundColor: moduleColors[id] }} />
        <span>Module {id}</span>
        <span className="count">{nodes.size} nodes</span>
        <button onClick={() => highlightModule(id)}>🔍</button>
      </li>
    ))}
  </ul>
  <div className="cut-edges">
    <span className="cut-badge">{partition.cutEdges.length} cut edges</span>
    <span>Modularity: {partition.modularity.toFixed(3)}</span>
    <span>Conductance: {partition.conductance.toFixed(3)}</span>
  </div>
</div>
```

### 5. Partition Export (`src/main/graph/export/partitionExport.ts`)
```typescript
export function exportPartitions(
  graph: CodeGraph,
  partition: PartitionResult,
  format: 'csv' | 'graphml' | 'dot' | 'markdown' | 'json'
): string {
  switch (format) {
    case 'csv':
      return exportCSV(graph, partition)
    case 'graphml':
      return exportGraphML(graph, partition)
    case 'dot':
      return exportDOT(graph, partition)
    case 'markdown':
      return exportMarkdown(graph, partition)
    case 'json':
      return JSON.stringify(partition, null, 2)
  }
}

// CSV: nodeId,filePath,name,type,moduleId,internalDegree,externalDegree
// GraphML: full graph with module grouping
// DOT: for GraphViz rendering with subgraphs per module
// Markdown: documentation-ready module summary
```

### 6. Export Dialog (`src/App/components/ExportDialog.tsx`)
```tsx
<Dialog open={isOpen} onClose={() => setIsOpen(false)}>
  <DialogContent>
    <DialogHeader>Export Module Boundaries</DialogHeader>
    <div className="space-y-4">
      <Select label="Format" options={['CSV', 'GraphML', 'DOT', 'Markdown', 'JSON']} />
      <Checkbox label="Include cut edges" defaultChecked />
      <Checkbox label="Include metrics" defaultChecked />
      <Textarea label="Custom template (optional)" placeholder="Handlebars template..." />
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleExport}>Export</Button>
      </DialogActions>
    </div>
  </DialogContent>
</Dialog>
```

## Algorithms Detail

### Stoer-Wagner (Global Min-Cut)
- O(V³) or O(VE + V²logV) with heap
- Recursive bisection for multi-way partition
- Guarantees global minimum cut
- Good baseline, slow on large graphs

### Louvain / Leiden
- O(E) typically, very fast
- Resolution parameter controls module granularity
- Leiden guarantees connected communities
- Best for large codebases (10k+ nodes)

### Spectral (Fiedler Vector)
- O(V³) for eigendecomposition
- Good for balanced partitions
- Can use Lanczos for sparse matrices
- Useful when you need exactly 2 balanced modules

### Custom s-t Min-Cut
- Define source set (e.g., entry points: main, handlers, exports)
- Define sink set (e.g., external dependencies: DB, HTTP, FS)
- Max-flow between them reveals architectural boundaries
- Most meaningful for architecture analysis

## Verification
- `npm run test:typecheck` passes
- `npm run test:lint` passes
- `npx vitest run` passes
- `npx playwright test test/e2e/code-graph-mincut.spec.ts` passes
- Manual: Run each algorithm → verify modules render → export CSV → verify content