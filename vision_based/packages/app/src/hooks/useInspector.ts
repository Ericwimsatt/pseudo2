import { useState, useEffect, useCallback } from 'react'
import type { SemanticNode, PseudoCodeLine } from '@pseudo2/shared'
import type { InspectorState } from '../controllers/InspectorController'
import { useControllers } from './useControllers'
import { globalEventBus } from '@pseudo2/shared'

export function useInspector() {
  const { inspector } = useControllers()
  const [state, setState] = useState<InspectorState>(inspector.getState())

  const updateState = useCallback(() => {
    setState({ ...inspector.getState() })
  }, [inspector])

  useEffect(() => {
    const sub1 = globalEventBus.on('inspector:node-selected', updateState)
    const sub2 = globalEventBus.on('inspector:line-selected', updateState)

    return () => {
      sub1.unsubscribe()
      sub2.unsubscribe()
    }
  }, [updateState])

  return {
    selectedNode: state.selectedNode,
    selectedLine: state.selectedLine,
    selectNode: (node: SemanticNode) => inspector.selectNode(node),
    selectLine: (line: PseudoCodeLine) => inspector.selectLine(line),
    clear: () => inspector.clear()
  }
}
