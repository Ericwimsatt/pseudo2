import type {
  SemanticNode,
  SemanticNodeType,
  Relationship,
  NodeMetadata,
  SourceLocation
} from '@pseudo2/shared'
import { generateId } from '@pseudo2/shared'

export function createSemanticNode(
  type: SemanticNodeType,
  options: {
    name?: string
    location?: SourceLocation
    parentId?: string
    metadata?: NodeMetadata
  } = {}
): SemanticNode {
  return {
    id: generateId(type.toLowerCase()),
    type,
    name: options.name,
    children: [],
    relationships: [],
    metadata: options.metadata || {},
    location: options.location,
    parentId: options.parentId
  }
}

export function addChild(parent: SemanticNode, child: SemanticNode): void {
  child.parentId = parent.id
  parent.children.push(child)
}

export function addRelationship(
  node: SemanticNode,
  relationship: Relationship
): void {
  node.relationships.push(relationship)
}

export function findNodeById(
  root: SemanticNode,
  id: string
): SemanticNode | null {
  if (root.id === id) return root

  for (const child of root.children) {
    const found = findNodeById(child, id)
    if (found) return found
  }

  return null
}

export function findAllNodes(
  root: SemanticNode,
  predicate: (node: SemanticNode) => boolean
): SemanticNode[] {
  const results: SemanticNode[] = []

  if (predicate(root)) {
    results.push(root)
  }

  for (const child of root.children) {
    results.push(...findAllNodes(child, predicate))
  }

  return results
}

export function flattenNodes(root: SemanticNode): SemanticNode[] {
  const nodes: SemanticNode[] = [root]

  for (const child of root.children) {
    nodes.push(...flattenNodes(child))
  }

  return nodes
}
