import ts from 'typescript'
import type { SemanticNode, LanguageAdapter } from '@pseudo2/shared'
import { TypeScriptVisitor, type VisitorContext } from '../visitors'

export class TypeScriptAdapter implements LanguageAdapter {
  private visitor = new TypeScriptVisitor()

  adapt(ast: unknown): SemanticNode[] {
    const sourceFile = ast as ts.SourceFile
    const nodes: SemanticNode[] = []

    const context: VisitorContext = {
      sourceFile,
      filename: sourceFile.fileName
    }

    ts.forEachChild(sourceFile, node => {
      const semanticNode = this.visitor.visit(node, context)
      if (semanticNode) {
        nodes.push(semanticNode)
      }
    })

    return nodes
  }
}
