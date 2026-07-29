# Phase 5: Polish & Agent Debug

## Goal
Production hardening, comprehensive IPC test coverage for agent debugging, documentation, and performance optimization.

## IPC Agent Debugging

### Dedicated Test Suite (`test/agent-debug/`)
```
test/agent-debug/
├── graph-ipc.test.ts           # Full IPC workflow tests
├── graph-build.test.ts         # Build pipeline tests  
├── graph-query.test.ts         # Query API tests
├── graph-mincut.test.ts        # Partitioning tests
├── graph-export.test.ts        # Export format tests
└── fixtures/
    ├── simple-project/         # Minimal test project
    ├── circular-deps/          # Known circular deps
    ├── deep-call-chain/        # 10+ depth chain
    └── multi-module/           # Clear module boundaries
```

### Agent Test Helpers (`test/agent-debug/helpers.ts`)
```typescript
// Reusable helpers for agent scripts
export async function buildGraph(app: Electron.App, force = false) {
  return app.evaluate(async ({ ipcRenderer }) => {
    return ipcRenderer.invoke('graph:build', { forceRebuild: force })
  })
}

export async function querySubgraph(app: Electron.App, nodeIds: string[], depth = 2) {
  return app.evaluate(async ({ ipcRenderer }) => {
    return ipcRenderer.invoke('graph:query', { type: 'subgraph', nodeIds, depth })
  })
}

export async function runMinCut(app: Electron.App, algorithm = 'louvain', options = {}) {
  return app.evaluate(async ({ ipcRenderer }) => {
    return ipcRenderer.invoke('graph:mincut', { algorithm, ...options })
  })
}

export async function exportPartition(app: Electron.App, format = 'csv') {
  return app.evaluate(async ({ ipcRenderer }) => {
    return ipcRenderer.invoke('graph:export', { format, includeMetrics: true })
  })
}

// Agent can import and use:
// import { buildGraph, querySubgraph, runMinCut } from './test/agent-debug/helpers'
// const result = await buildGraph(app)
// console.log(JSON.stringify(result, null, 2))
```

### Debug Commands (package.json)
```json
{
  "scripts": {
    "agent:graph-build": "vitest run test/agent-debug/graph-build.test.ts",
    "agent:graph-query": "vitest run test/agent-debug/graph-query.test.ts", 
    "agent:graph-mincut": "vitest run test/agent-debug/graph-mincut.test.ts",
    "agent:graph-full": "vitest run test/agent-debug/graph-ipc.test.ts"
  }
}
```

### IPC Logging for Agents
```typescript
// In ipcHandlers.ts - add debug logging
const DEBUG = process.env.GRAPH_DEBUG === 'true'

function log(channel: string, args: any, result: any) {
  if (DEBUG) {
    console.log(`[GRAPH:IPC] ${channel}`, {
      input: JSON.stringify(args, null, 2),
      output: JSON.stringify(result, null, 2).slice(0, 500)
    })
  }
}

// Agent can enable: GRAPH_DEBUG=true npm run dev
```

## Performance Optimization

### Graph Build
- Incremental updates: only re-parse changed files
- Worker thread for parsing (avoid blocking main)
- Streaming progress events

### Query Performance
- Pre-built indices: adjacency maps, reverse adjacency, node-to-module
- LRU cache for frequent queries (neighbors, subgraphs)
- Pagination for large result sets

### Canvas Rendering
- Level-of-detail: hide labels when zoomed out
- Virtualized rendering for 5000+ nodes
- WebGL renderer option (cytoscape-webgl)

## Documentation

### Agent Guide (`docs/agent-graph-debugging.md`)
```markdown
# Agent Guide: Code Graph IPC Debugging

## Quick Start
```bash
# Enable debug logging
GRAPH_DEBUG=true npm run dev

# In another terminal, run agent tests
npm run agent:graph-full
```

## Available IPC Channels
| Channel | Input | Output |
|---------|-------|--------|
| graph:build | {forceRebuild?: boolean} | {success, stats} |
| graph:query | {type, ...params} | {nodes[], edges[]} |
| graph:mincut | {algorithm, options} | {partitions, modules, cutEdges} |
| graph:export | {format} | {data: string} |

## Example Agent Script
```typescript
import { app } from 'electron'

async function analyzeArchitecture() {
  // 1. Build graph
  const build = await app.evaluate(({ipcRenderer}) => 
    ipcRenderer.invoke('graph:build', {forceRebuild: true})
  )
  
  // 2. Find entry points (exported functions)
  const entryPoints = build.stats.nodes.filter(n => n.exported && n.type === 'function')
  
  // 3. Run min-cut with entry points as sources
  const partition = await app.evaluate(({ipcRenderer}) =>
    ipcRenderer.invoke('graph:mincut', {
      algorithm: 'st-targeted',
      sourceNodes: entryPoints.map(n => n.id),
      targetNodes: [] // auto-detect external deps
    })
  )
  
  // 4. Export for documentation
  const markdown = await app.evaluate(({ipcRenderer}) =>
    ipcRenderer.invoke('graph:export', {format: 'markdown', includeMetrics: true})
  )
  
  return { build, partition, markdown }
}
```

## Troubleshooting
- "Graph not built": Call `graph:build` first
- "Node not found": Check nodeId format: `filePath::symbolName`
- "Min-cut slow": Use Louvain for >5000 nodes, reduce resolution
```

## Verification Checklist
- [ ] `npm run test:typecheck` - zero errors
- [ ] `npm run test:lint` - zero warnings  
- [ ] `npx vitest run` - all unit/integration pass
- [ ] `npm run test:e2e` - all E2E pass
- [ ] `npm run test:smoke` - smoke tests pass
- [ ] `npm run build` - production build succeeds
- [ ] `npm run agent:graph-full` - agent debug tests pass
- [ ] Manual: Open DevTools → Console → test IPC manually
- [ ] Manual: Build graph on large fixture repo (>100 files) < 5s
- [ ] Manual: Run min-cut on large graph < 10s
- [ ] Manual: Export all formats → verify valid output