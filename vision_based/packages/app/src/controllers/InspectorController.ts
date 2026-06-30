import type { SemanticNode, PseudoCodeLine } from '@pseudo2/shared'
import { globalEventBus } from '@pseudo2/shared'

export interface InspectorState {
  selectedNode: SemanticNode | null
  selectedLine: PseudoCodeLine | null
}

export class InspectorController {
  private state: InspectorState = {
    selectedNode: null,
    selectedLine: null
  }

  selectNode(node: SemanticNode): void {
    this.state.selectedNode = node
    globalEventBus.emit('inspector:node-selected', { nodeId: node.id })
  }

  selectLine(line: PseudoCodeLine): void {
    this.state.selectedLine = line
    if (line.nodes.length > 0) {
      this.selectNode(line.nodes[0])
    }
    globalEventBus.emit('inspector:line-selected', { lineId: line.id })
  }

  getSelectedNode(): SemanticNode | null {
    return this.state.selectedNode
  }

  getSelectedLine(): PseudoCodeLine | null {
    return this.state.selectedLine
  }

  clear(): void {
    this.state.selectedNode = null
    this.state.selectedLine = null
  }

  getState(): InspectorState {
    return { ...this.state }
  }
}
