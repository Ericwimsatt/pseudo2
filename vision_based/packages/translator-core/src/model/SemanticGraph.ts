import type {
  SemanticNode,
  SemanticGraph as ISemanticGraph,
  SemanticEdge
} from '@pseudo2/shared'
import { flattenNodes } from '../semantic/nodes'

export class SemanticGraph implements ISemanticGraph {
  nodes = new Map<string, SemanticNode>()
  edges: SemanticEdge[] = []

  addNode(node: SemanticNode): void {
    this.nodes.set(node.id, node)

    const allNodes = flattenNodes(node)
    for (const n of allNodes) {
      this.nodes.set(n.id, n)
    }

    for (const n of allNodes) {
      for (const rel of n.relationships) {
        this.edges.push({
          source: n.id,
          target: rel.targetId,
          type: rel.type,
          metadata: rel.label ? { label: rel.label } : undefined
        })
      }
    }
  }

  getNode(id: string): SemanticNode | undefined {
    return this.nodes.get(id)
  }

  getEdgesFrom(nodeId: string): SemanticEdge[] {
    return this.edges.filter(e => e.source === nodeId)
  }

  getEdgesTo(nodeId: string): SemanticEdge[] {
    return this.edges.filter(e => e.target === nodeId)
  }

  clear(): void {
    this.nodes.clear()
    this.edges = []
  }
}
