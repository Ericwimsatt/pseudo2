import type { SourceLocation } from './location'
import type { SemanticNode } from './semantic'

export interface SourceFile {
  path: string
  content: string
  language: string
  ast?: unknown
  semanticNodes?: SemanticNode[]
  lastModified?: number
}

export interface Repository {
  root: string
  name: string
  files: Map<string, SourceFile>
  symbolGraph: SymbolGraph
  semanticGraph: SemanticGraph
  metadata: RepositoryMetadata
  languageServices: LanguageServices
  addFile(file: SourceFile): void
  getFile(path: string): SourceFile | undefined
  removeFile(path: string): void
  getAllFiles(): SourceFile[]
  clear(): void
}

export interface SymbolGraph {
  symbols: Map<string, Symbol>
  relationships: SymbolRelationship[]
}

export interface Symbol {
  id: string
  name: string
  kind: SymbolKind
  location: SourceLocation
  references: string[]
  definitions: string[]
}

export type SymbolKind =
  | 'function'
  | 'class'
  | 'interface'
  | 'type'
  | 'variable'
  | 'constant'
  | 'enum'
  | 'module'
  | 'namespace'
  | 'method'
  | 'property'
  | 'parameter'

export interface SymbolRelationship {
  source: string
  target: string
  kind: 'extends' | 'implements' | 'imports' | 'exports' | 'references'
}

export interface SemanticGraph {
  nodes: Map<string, SemanticNode>
  edges: SemanticEdge[]
  addNode(node: SemanticNode): void
  clear(): void
}

export interface SemanticEdge {
  source: string
  target: string
  type: string
  metadata?: Record<string, unknown>
}

export interface RepositoryMetadata {
  language: string
  version?: string
  description?: string
  authors?: string[]
  license?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

export interface LanguageServices {
  parser: LanguageParser
  visitors: LanguageVisitor[]
  adapters: LanguageAdapter[]
}

export interface LanguageParser {
  parse(source: string, filename: string): Promise<unknown>
  validate(ast: unknown): boolean
}

export interface LanguageVisitor {
  visit(node: unknown): SemanticNode | null
}

export interface LanguageAdapter {
  adapt(ast: unknown): SemanticNode[]
}
