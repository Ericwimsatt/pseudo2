import type { SemanticNode, Relationship, RelationshipType } from '@pseudo2/shared'

export function createRelationship(
  type: RelationshipType,
  targetId: string,
  label?: string
): Relationship {
  return { type, targetId, label }
}

export function findRelationships(
  node: SemanticNode,
  type?: RelationshipType
): Relationship[] {
  if (!type) return node.relationships
  return node.relationships.filter(r => r.type === type)
}

export function hasRelationship(
  node: SemanticNode,
  type: RelationshipType,
  targetId?: string
): boolean {
  return node.relationships.some(
    r => r.type === type && (!targetId || r.targetId === targetId)
  )
}
