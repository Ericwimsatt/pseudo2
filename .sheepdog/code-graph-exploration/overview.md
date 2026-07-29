# Code Graph Exploration - Task Overview

## Goal
Add a standalone code graph exploration tool to pseudo2 that enables developers to visualize and navigate cross-file call/dependency graphs. Designed for single-repo static analysis with IPC-first architecture for agent debuggability.

## Scope
- Single TypeScript/TSX repository (existing project)
- Static analysis only (no runtime instrumentation)
- IPC-accessible graph queries for agent testing
- Standalone UI tab with graph generation button in header
- Min-cut based module boundary detection

## Architecture

### Data Flow
```
TypeScript Source Files
    ↓ (ts-morph Project.create() — full program analysis)
Cross-File AST (functions, classes, calls, imports, types)
    ↓ (Graph construction from AST nodes + edges)
Call Graph + Dependency Graph (nodes + weighted edges)
    ↓ (Min-cut algorithms)
Module Boundaries + Cohesion Metrics
    ↓ (IPC serialization)
Frontend Visualization (Cytoscape.js / React Flow)
```

### Key Design Decision: ts-morph (not makeSemanticGraph)
We use **ts-morph** directly for AST analysis rather than the existing `makeSemanticGraph` infrastructure. ts-morph gives us:
- Full TypeScript program analysis with type checking
- Cross-file symbol resolution via `Project.create()` with a tsconfig
- Direct access to AST nodes (call expressions, imports, declarations)
- Type information for edges (return types, parameter types)

This means a fresh graph builder, not an extension of `translationService/makeSemanticGraph`.

### IPC-First Design
All graph operations exposed via IPC channels:
- `graph:build` - Build full graph from project
- `graph:query` - Query subgraph (neighbors, paths, modules)
- `graph:mincut` - Run min-cut on subgraph
- `graph:metrics` - Get coupling/cohesion metrics

Agents can test by sending IPC messages directly.

## Phases

1. **Graph Engine** - Core graph data structures, ts-morph parsing, min-cut algorithms
2. **IPC Graph Service** - Main process service exposing graph operations via IPC
3. **UI Integration** - Header button, graph tab, Cytoscape.js visualization
4. **Min-Cut Visualization** - Interactive module boundary detection UI
5. **Polish & Agent Debug** - Test IPC endpoints, verify agent workflows

## Key Files to Create/Modify

### New Files
- `src/main/graph/` - Graph engine (core algorithms)
- `src/main/graph/ipcHandlers.ts` - IPC handlers
- `src/App/components/CodeGraphTab.tsx` - Main graph UI
- `src/App/components/GraphToolbar.tsx` - Header button + controls

### Modified Files
- `src/main/preload.ts` - Add IPC channel definitions
- `src/main/index.ts` - Register graph service
- `src/App/App.tsx` - Add graph tab to layout
- `src/App/components/Sidebar.tsx` - Add graph navigation item
