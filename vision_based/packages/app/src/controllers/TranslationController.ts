import type { SemanticNode, PseudoCodeBlock } from '@pseudo2/shared'
import { PseudoCodeRenderer } from '@pseudo2/translator-core'
import { globalEventBus } from '@pseudo2/shared'

export class TranslationController {
  private renderer = new PseudoCodeRenderer()
  private cache = new Map<string, PseudoCodeBlock>()

  translate(nodes: SemanticNode[], file: string): PseudoCodeBlock {
    const cacheKey = `${file}_${nodes.length}`

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    globalEventBus.emit('translation:started', { file })

    const result = this.renderer.render(nodes)
    this.cache.set(cacheKey, result)

    globalEventBus.emit('translation:completed', {
      file,
      nodeCount: nodes.length
    })

    return result
  }

  clearCache(): void {
    this.cache.clear()
  }

  invalidateFile(file: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(file)) {
        this.cache.delete(key)
      }
    }
  }
}
