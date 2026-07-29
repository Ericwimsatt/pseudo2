# Phase 2: IPC Graph Service

## Goal
Expose the Graph Engine via IPC channels so:
- Renderer process can request graph operations
- **Agents can send IPC messages directly for debugging/testing**
- Main process owns graph state (single source of truth)

## IPC Channels (`src/main/graph/ipcHandlers.ts`)

### Channel Definitions (add to `src/main/preload.ts`)
```typescript
// Main → Renderer (events)
'graph:progress'      // { phase: string; progress: number; message: string }
'graph:built'         // { nodeCount: number; edgeCount: number; duration: number }
'graph:error'         // { code: string; message: string }

// Renderer → Main (invokes)
'graph:build'         // { forceRebuild?: boolean } → { success: boolean; stats: GraphStats }
'graph:query'         // GraphQuery → GraphQueryResult
'graph:mincut'        // MinCutOptions → PartitionResult
'graph:metrics'       // MetricsOptions → MetricsResult
'graph:export'        // ExportOptions → { format: string; data: string }
```

### Handler Implementation
```typescript
// In src/main/graph/ipcHandlers.ts
import { ipcMain } from 'electron'
import { GraphService } from './graphService'

const graphService = new GraphService()

ipcMain.handle('graph:build', async (_e, opts) => {
  return graphService.build(opts)
})

ipcMain.handle('graph:query', async (_e, query) => {
  return graphService.query(query)
})

ipcMain.handle('graph:mincut', async (_e, opts) => {
  return graphService.minCut(opts)
})

ipcMain.handle('graph:metrics', async (_e, opts) => {
  return graphService.metrics(opts)
})

ipcMain.handle('graph:export', async (_e, opts) => {
  return graphService.export(opts)
})
```

## Graph Service (`src/main/graph/graphService.ts`)

### State Management
- Single `CodeGraph` instance per project
- Cache with invalidation on file changes (watch via existing project service)
- Progress events during build

### Build Process
```typescript
async build(opts: { forceRebuild?: boolean }): Promise<{ success: boolean; stats: GraphStats }> {
  if (!opts.forceRebuild && this.graph && !this.isStale()) return { success: true, stats: this.getStats() }
  
  this.emitProgress('discovering', 0, 'Finding project files...')
  
  this.emitProgress('parsing', 20, 'Parsing AST with ts-morph...')
  const graph = this.graphBuilder.build()
  
  this.emitProgress('indexing', 80, 'Building query indices...')
  this.queryIndex.build(graph)
  
  this.graph = graph
  this.emitProgress('complete', 100, 'Graph ready')
  return { success: true, stats: this.getStats() }
}
```

### Query Types
```typescript
type GraphQuery =
  | { type: 'subgraph'; nodeIds: string[]; depth?: number }
  | { type: 'neighbors'; nodeId: string; direction: 'in' | 'out' | 'both'; maxDepth?: number }
  | { type: 'paths'; from: string; to: string; maxPaths?: number; maxDepth?: number }
  | { type: 'module'; moduleId: number }
  | { type: 'hotspots'; threshold?: number; metric: 'degree' | 'betweenness' | 'coupling' }
```

## Agent Debugging

### Direct IPC Testing
Agents can test via Electron's `ipcRenderer` (in DevTools console or test scripts):

```javascript
// In renderer DevTools or test file
const result = await window.electron.ipcRenderer.invoke('graph:build', { forceRebuild: true })
console.log(result)

// Query subgraph around a function
const subgraph = await window.electron.ipcRenderer.invoke('graph:query', {
  type: 'subgraph',
  nodeIds: ['src/main/foo.ts::myFunction'],
  depth: 2
})

// Run min-cut
const partition = await window.electron.ipcRenderer.invoke('graph:mincut', {
  algorithm: 'louvain',
  minModuleSize: 5,
  maxModules: 20
})
```

### Test Script for Agents
```typescript
// test/agent-debug/graph-ipc.test.ts
// Run with: npx vitest run test/agent-debug/graph-ipc.test.ts
import { describe, it, expect } from 'vitest'
import { app } from 'electron'

describe('Graph IPC (agent debug)', () => {
  it('builds graph', async () => {
    const result = await app.evaluate(async () => {
      return window.electron.ipcRenderer.invoke('graph:build', { forceRebuild: true })
    })
    expect(result.success).toBe(true)
    expect(result.stats.nodeCount).toBeGreaterThan(0)
  })
  
  it('runs min-cut', async () => {
    const result = await app.evaluate(async () => {
      return window.electron.ipcRenderer.invoke('graph:mincut', { algorithm: 'stocher-wagner' })
    })
    expect(result.partitions).toBeDefined()
  })
})
```

## Integration
- Register handlers in `src/main/index.ts` after project service init
- Reuse existing `projectService` for file watching
- Progress events use existing `appStore` notification system

## Verification
- `npm run test:typecheck` passes
- `npm run test:lint` passes
- `npx vitest run` passes
- Manual test: Open DevTools → Console → run IPC invokes → verify responses