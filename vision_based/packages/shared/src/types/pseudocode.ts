import type { SemanticNode } from './semantic'

export interface PseudoCodeLine {
  id: string
  content: string
  indent: number
  nodes: SemanticNode[]
  metadata?: LineMetadata
}

export interface LineMetadata {
  highlighted?: boolean
  breakpoint?: boolean
  error?: string
  warning?: string
  info?: string
}

export interface PseudoCodeBlock {
  lines: PseudoCodeLine[]
  metadata?: BlockMetadata
}

export interface BlockMetadata {
  title?: string
  description?: string
  language?: string
}
