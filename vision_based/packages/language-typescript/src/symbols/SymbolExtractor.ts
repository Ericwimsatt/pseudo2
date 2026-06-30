import ts from 'typescript'
import type { Symbol, SymbolKind, SourceLocation } from '@pseudo2/shared'
import { generateId } from '@pseudo2/shared'

export class SymbolExtractor {
  extract(sourceFile: ts.SourceFile, filename: string): Symbol[] {
    const symbols: Symbol[] = []

    const visit = (node: ts.Node) => {
      const symbol = this.extractSymbol(node, sourceFile, filename)
      if (symbol) {
        symbols.push(symbol)
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)

    return symbols
  }

  private extractSymbol(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    filename: string
  ): Symbol | null {
    const kind = this.getSymbolKind(node)
    if (!kind) return null

    const name = this.getSymbolName(node, sourceFile)
    if (!name) return null

    const location = this.getLocation(node, sourceFile, filename)

    return {
      id: generateId('symbol'),
      name,
      kind,
      location,
      references: [],
      definitions: [location.file]
    }
  }

  private getSymbolKind(node: ts.Node): SymbolKind | null {
    switch (node.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
        return 'function'
      case ts.SyntaxKind.ClassDeclaration:
        return 'class'
      case ts.SyntaxKind.InterfaceDeclaration:
        return 'interface'
      case ts.SyntaxKind.TypeAliasDeclaration:
        return 'type'
      case ts.SyntaxKind.VariableDeclaration:
        return this.isConst(node as ts.VariableDeclaration) ? 'constant' : 'variable'
      case ts.SyntaxKind.EnumDeclaration:
        return 'enum'
      case ts.SyntaxKind.ModuleDeclaration:
        return 'namespace'
      case ts.SyntaxKind.MethodDeclaration:
        return 'method'
      case ts.SyntaxKind.PropertyDeclaration:
        return 'property'
      case ts.SyntaxKind.Parameter:
        return 'parameter'
      default:
        return null
    }
  }

  private getSymbolName(node: ts.Node, sourceFile: ts.SourceFile): string | null {
    if (ts.isFunctionDeclaration(node) && node.name) {
      return node.name.text
    }
    if (ts.isClassDeclaration(node) && node.name) {
      return node.name.text
    }
    if (ts.isInterfaceDeclaration(node)) {
      return node.name.text
    }
    if (ts.isTypeAliasDeclaration(node)) {
      return node.name.text
    }
    if (ts.isVariableDeclaration(node)) {
      return node.name.getText(sourceFile)
    }
    if (ts.isEnumDeclaration(node)) {
      return node.name.text
    }
    if (ts.isModuleDeclaration(node)) {
      return node.name.getText(sourceFile)
    }
    if (ts.isMethodDeclaration(node)) {
      return node.name.getText(sourceFile)
    }
    if (ts.isPropertyDeclaration(node)) {
      return node.name.getText(sourceFile)
    }
    if (ts.isParameter(node)) {
      return node.name.getText(sourceFile)
    }

    return null
  }

  private getLocation(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    filename: string
  ): SourceLocation {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart())
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd())

    return {
      file: filename,
      start: {
        line: start.line + 1,
        column: start.character,
        offset: node.getStart()
      },
      end: {
        line: end.line + 1,
        column: end.character,
        offset: node.getEnd()
      }
    }
  }

  private isConst(node: ts.VariableDeclaration): boolean {
    return node.parent &&
      ts.isVariableDeclarationList(node.parent) &&
      (node.parent.flags & ts.NodeFlags.Const) !== 0
  }
}
