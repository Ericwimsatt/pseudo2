import { useState, useEffect } from 'react'
import type { SemanticNode, PseudoCodeBlock } from '@pseudo2/shared'
import { useControllers } from './useControllers'

export function useTranslation(nodes: SemanticNode[], file: string) {
  const { translation } = useControllers()
  const [result, setResult] = useState<PseudoCodeBlock | null>(null)

  useEffect(() => {
    if (nodes.length > 0) {
      const block = translation.translate(nodes, file)
      setResult(block)
    } else {
      setResult(null)
    }
  }, [nodes, file, translation])

  return result
}
