# Phase 1: Graph Engine

## Goal
Build the core static analysis engine using **ts-morph** that:
1. Parses all TS/TSX files via `Project.create()` with the project's tsconfig
2. Constructs a cross-file call graph (functions → function calls) and dependency graph (imports)
3. Implements min-cut / graph partitioning algorithms for module boundary detection
4. Exposes TypeScript APIs for graph queries

**Do NOT use `makeSemanticGraph` from `translationService/`.** Use ts-morph directly.

## Deliverables

### Core Types (`src/main/graph/types.ts`)
```typescript
type NodeType = 'function' | 'class' | 'method' | 'variable' | 'import' | 'export' | 'type' | 'interface'
type EdgeType = 'call' | 'import' | 'extends' | 'implements' | 'references' | 'type-import'

interface GraphNode {
  id: string              // "src/main/foo.ts::functionName"
  filePath: string        // relative to repo root
  name: string            // short name
  type: NodeType
  line: number
  exports?: string[]
}

interface GraphEdge {
  from: string            // node id
  to: string              // node id
  type: EdgeType
  weight: number          // call count, or 1 for structural
  meta?: Record<string, any>
}

interface CodeGraph {
  nodes: Map<string, GraphNode>
  edges: GraphEdge[]
  adjacency: Map<string, Set<string>>   // outgoing
  reverseAdjacency: Map<string, Set<string>> // incoming
}

interface GraphStats {
  nodeCount: number
  edgeCount: number
  fileCount: number
  avgDegree: number
  maxDegree: number
}
```

### Graph Builder (`src/main/graph/graphBuilder.ts`)
Use ts-morph's `Project` to parse the entire codebase:

```typescript
import { Project, Node, SourceFile, FunctionDeclaration, ClassDeclaration, CallExpression, ImportDeclaration } from 'ts-morph'

export class GraphBuilder {
  private project: Project

  constructor(tsconfigPath: string) {
    this.project = new Project({
      tsConfigFilePath: tsconfigPath,
      skipAddingFilesFromTsConfig: false,
    })
  }

  build(): CodeGraph {
    const graph: CodeGraph = { nodes: new Map(), edges: [], adjacency: new Map(), reverseAdjacency: new Map() }

    for (const sourceFile of this.project.getSourceFiles()) {
      this.processSourceFile(sourceFile, graph)
    }

    this.resolveCrossFileReferences(graph)
    return graph
  }

  private processSourceFile(sf: SourceFile, graph: CodeGraph) {
    // Extract: function declarations, class declarations, method declarations
    // Extract: call expressions → find target declarations
    // Extract: import declarations → track import graph
    // Extract: export declarations
    // For each node: create GraphNode with id = "filePath::name"
    // For each relationship: create GraphEdge with appropriate type and weight
  }

  private resolveCrossFileReferences(graph: CodeGraph) {
    // Use ts-morph symbol resolution to map call targets across files
    // Use TypeChecker to resolve import targets
    // Weight edges by call frequency
  }
}
```

### Key ts-morph APIs to Use
- `Project.create({ tsConfigFilePath })` — full program with type info
- `sourceFile.getFunctions()` — function declarations
- `sourceFile.getClasses()` — class declarations
- `class.getMethods()` — method declarations
- `node.getCallExpressions()` — all call sites
- `node.getImportDeclarations()` — imports
- `node.getExportDeclarations()` — exports
- `typeChecker.getSymbolAtLocation()` — symbol resolution
- `typeChecker.getTypeAtLocation()` — type info
- `typeChecker.getDeclaredTypeOfSymbol()` — for return types

### Min-Cut / Partitioning (`src/main/graph/partitioning.ts`)
```typescript
interface PartitionResult {
  partitions: Map<string, number>    // nodeId → partition index
  cutEdges: GraphEdge[]              // edges crossing partitions
  modularity: number                 // Newman-Girvan modularity score
  conductance: number                // cut weight / min(vol(A), vol(B))
}

// Algorithms to implement:
// 1. Stoer-Wagner global min-cut (baseline)
// 2. Louvain/Leiden community detection (for multi-module)
// 3. Recursive bisection with size constraints (balanced modules)
```

### Graph Queries (`src/main/graph/queries.ts`)
```typescript
// Subgraph extraction
getSubgraph(nodeIds: string[], depth?: number): CodeGraph
getCallers(nodeId: string, maxDepth?: number): GraphNode[]
getCallees(nodeId: string, maxDepth?: number): GraphNode[]
getPaths(from: string, to: string, maxPaths?: number): string[][]

// Module boundaries
getModuleBoundaries(): PartitionResult
getNodeModule(nodeId: string): number
getModuleNodes(moduleId: number): GraphNode[]

// Metrics
getCoupling(nodeId: string): { afferent: number; efferent: number }
getCohesion(moduleId: number): number
getHotspots(threshold?: number): GraphNode[]
```

### Tests (`test/unit/graph/`)
- Unit tests for graph construction from fixture files
- Unit tests for partitioning algorithms on synthetic graphs
- Golden file tests for known fixture repos

## Integration Points
- Uses `ts-morph` package (already in package.json) for AST parsing
- Uses existing `src/main/project/projectService.ts` for file discovery
- No UI dependencies — pure TypeScript, testable in Vitest unit tests

## Verification
- `npm run test:typecheck` passes
- `npm run test:lint` passes
- `npx vitest run test/unit/graph/` passes
- Can build graph from `test/fixtures/repos/` without errors
