import type { SemanticNode, PseudoCodeBlock } from '@pseudo2/shared'

export interface Renderer {
  render(nodes: SemanticNode[]): PseudoCodeBlock
}

export interface RenderContext {
  indent: number
  depth: number
  parent?: SemanticNode
}

export interface RenderOptions {
  maxDepth?: number
  includeComments?: boolean
  includeTypes?: boolean
  simplifyExpressions?: boolean
}
