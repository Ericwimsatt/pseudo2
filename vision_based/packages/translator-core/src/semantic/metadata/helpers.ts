import type { SemanticNode, NodeMetadata } from '@pseudo2/shared'

export function setMetadata(
  node: SemanticNode,
  key: string,
  value: unknown
): void {
  node.metadata[key] = value
}

export function getMetadata<T>(
  node: SemanticNode,
  key: string
): T | undefined {
  return node.metadata[key] as T | undefined
}

export function mergeMetadata(
  node: SemanticNode,
  metadata: Partial<NodeMetadata>
): void {
  Object.assign(node.metadata, metadata)
}

export function hasMetadata(
  node: SemanticNode,
  key: string
): boolean {
  return key in node.metadata
}
