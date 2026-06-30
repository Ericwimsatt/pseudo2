import type { SourceLocation } from './location'

export type SemanticNodeType =
  | 'Function'
  | 'Class'
  | 'Method'
  | 'Variable'
  | 'Loop'
  | 'Conditional'
  | 'Return'
  | 'Assignment'
  | 'Expression'
  | 'Import'
  | 'Export'
  | 'Interface'
  | 'Type'
  | 'Parameter'
  | 'Property'
  | 'Block'
  | 'Call'
  | 'Literal'
  | 'Identifier'
  | 'Binary'
  | 'Unary'
  | 'Member'
  | 'Index'
  | 'ConditionalExpression'
  | 'Switch'
  | 'Case'
  | 'Try'
  | 'Catch'
  | 'Throw'
  | 'Break'
  | 'Continue'
  | 'Label'
  | 'Comment'
  | 'Unknown'

export interface SemanticNode {
  id: string
  type: SemanticNodeType
  name?: string
  children: SemanticNode[]
  relationships: Relationship[]
  metadata: NodeMetadata
  location?: SourceLocation
  parentId?: string
}

export interface Relationship {
  type: RelationshipType
  targetId: string
  label?: string
}

export type RelationshipType =
  | 'calls'
  | 'extends'
  | 'implements'
  | 'imports'
  | 'exports'
  | 'references'
  | 'defines'
  | 'uses'
  | 'contains'
  | 'parameter-of'
  | 'property-of'
  | 'method-of'
  | 'returns'
  | 'throws'

export interface NodeMetadata {
  visibility?: 'public' | 'private' | 'protected'
  static?: boolean
  abstract?: boolean
  async?: boolean
  readonly?: boolean
  optional?: boolean
  typeAnnotation?: string
  defaultValue?: string
  documentation?: string
  tags?: string[]
  [key: string]: unknown
}
