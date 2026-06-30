import ts from 'typescript'
import type { SemanticNode, SourceLocation } from '@pseudo2/shared'
import { createSemanticNode, addChild } from '@pseudo2/translator-core'

export interface VisitorContext {
  sourceFile: ts.SourceFile
  filename: string
  parent?: SemanticNode
}

export class TypeScriptVisitor {
  visit(node: ts.Node, context: VisitorContext): SemanticNode | null {
    const semanticNode = this.createNodeFromTS(node, context)

    if (!semanticNode) {
      this.visitChildren(node, context)
      return null
    }

    const childContext: VisitorContext = {
      ...context,
      parent: semanticNode
    }

    this.visitChildren(node, childContext)

    return semanticNode
  }

  private visitChildren(node: ts.Node, context: VisitorContext): void {
    ts.forEachChild(node, child => {
      this.visit(child, context)
    })
  }

  private createNodeFromTS(
    node: ts.Node,
    context: VisitorContext
  ): SemanticNode | null {
    const location = this.getLocation(node, context)

    switch (node.kind) {
      case ts.SyntaxKind.FunctionDeclaration:
        return this.visitFunctionDeclaration(node as ts.FunctionDeclaration, context, location)

      case ts.SyntaxKind.ClassDeclaration:
        return this.visitClassDeclaration(node as ts.ClassDeclaration, context, location)

      case ts.SyntaxKind.MethodDeclaration:
        return this.visitMethodDeclaration(node as ts.MethodDeclaration, context, location)

      case ts.SyntaxKind.VariableDeclaration:
        return this.visitVariableDeclaration(node as ts.VariableDeclaration, context, location)

      case ts.SyntaxKind.IfStatement:
        return this.visitIfStatement(node as ts.IfStatement, context, location)

      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
        return this.visitLoop(node as ts.IterationStatement, context, location)

      case ts.SyntaxKind.ReturnStatement:
        return this.visitReturnStatement(node as ts.ReturnStatement, context, location)

      case ts.SyntaxKind.ImportDeclaration:
        return this.visitImportDeclaration(node as ts.ImportDeclaration, context, location)

      case ts.SyntaxKind.ExportDeclaration:
      case ts.SyntaxKind.ExportAssignment:
        return this.visitExportDeclaration(node, context, location)

      case ts.SyntaxKind.InterfaceDeclaration:
        return this.visitInterfaceDeclaration(node as ts.InterfaceDeclaration, context, location)

      case ts.SyntaxKind.TypeAliasDeclaration:
        return this.visitTypeAliasDeclaration(node as ts.TypeAliasDeclaration, context, location)

      case ts.SyntaxKind.CallExpression:
        return this.visitCallExpression(node as ts.CallExpression, context, location)

      case ts.SyntaxKind.Parameter:
        return this.visitParameter(node as ts.ParameterDeclaration, context, location)

      case ts.SyntaxKind.PropertyDeclaration:
        return this.visitPropertyDeclaration(node as ts.PropertyDeclaration, context, location)

      case ts.SyntaxKind.Block:
        return this.visitBlock(node as ts.Block, context, location)

      case ts.SyntaxKind.ArrowFunction:
        return this.visitArrowFunction(node as ts.ArrowFunction, context, location)

      case ts.SyntaxKind.EnumDeclaration:
        return this.visitEnumDeclaration(node as ts.EnumDeclaration, context, location)

      case ts.SyntaxKind.JsxElement:
      case ts.SyntaxKind.JsxSelfClosingElement:
      case ts.SyntaxKind.JsxFragment:
        return this.visitJsxElement(node, context, location)

      default:
        return null
    }
  }

  private visitFunctionDeclaration(
    node: ts.FunctionDeclaration,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Function', {
      name: node.name?.text,
      location,
      metadata: {
        async: node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword),
        typeAnnotation: node.type ? this.getTypeText(node.type, context) : undefined
      }
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitClassDeclaration(
    node: ts.ClassDeclaration,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Class', {
      name: node.name?.text,
      location
    })

    if (node.heritageClauses) {
      for (const clause of node.heritageClauses) {
        if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
          for (const type of clause.types) {
            semanticNode.relationships.push({
              type: 'extends',
              targetId: type.expression.getText(context.sourceFile),
              label: type.expression.getText(context.sourceFile)
            })
          }
        } else if (clause.token === ts.SyntaxKind.ImplementsKeyword) {
          for (const type of clause.types) {
            semanticNode.relationships.push({
              type: 'implements',
              targetId: type.expression.getText(context.sourceFile),
              label: type.expression.getText(context.sourceFile)
            })
          }
        }
      }
    }

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitMethodDeclaration(
    node: ts.MethodDeclaration,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Method', {
      name: node.name.getText(context.sourceFile),
      location,
      metadata: {
        async: node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword),
        static: node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword),
        visibility: this.getVisibility(node.modifiers),
        typeAnnotation: node.type ? this.getTypeText(node.type, context) : undefined
      }
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitVariableDeclaration(
    node: ts.VariableDeclaration,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const isConst = node.parent &&
      ts.isVariableDeclarationList(node.parent) &&
      (node.parent.flags & ts.NodeFlags.Const) !== 0

    const semanticNode = createSemanticNode('Variable', {
      name: node.name.getText(context.sourceFile),
      location,
      metadata: {
        readonly: isConst,
        typeAnnotation: node.type ? this.getTypeText(node.type, context) : undefined,
        defaultValue: node.initializer ? node.initializer.getText(context.sourceFile) : undefined
      }
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitIfStatement(
    node: ts.IfStatement,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Conditional', {
      location,
      metadata: {
        condition: node.expression.getText(context.sourceFile)
      }
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitLoop(
    node: ts.IterationStatement,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    let condition = ''

    if (ts.isWhileStatement(node) || ts.isDoStatement(node)) {
      condition = node.expression.getText(context.sourceFile)
    } else if (ts.isForStatement(node)) {
      condition = node.condition ? node.condition.getText(context.sourceFile) : 'true'
    } else if (ts.isForInStatement(node)) {
      condition = `${node.initializer.getText(context.sourceFile)} in ${node.expression.getText(context.sourceFile)}`
    } else if (ts.isForOfStatement(node)) {
      condition = `${node.initializer.getText(context.sourceFile)} of ${node.expression.getText(context.sourceFile)}`
    }

    const semanticNode = createSemanticNode('Loop', {
      location,
      metadata: { condition }
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitReturnStatement(
    node: ts.ReturnStatement,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Return', {
      location
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitImportDeclaration(
    node: ts.ImportDeclaration,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Import', {
      location,
      metadata: {
        source: node.moduleSpecifier.getText(context.sourceFile)
      }
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitExportDeclaration(
    node: ts.Node,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Export', {
      location
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitInterfaceDeclaration(
    node: ts.InterfaceDeclaration,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Interface', {
      name: node.name.text,
      location
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitTypeAliasDeclaration(
    node: ts.TypeAliasDeclaration,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Type', {
      name: node.name.text,
      location,
      metadata: {
        typeAnnotation: node.type.getText(context.sourceFile)
      }
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitCallExpression(
    node: ts.CallExpression,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Call', {
      name: node.expression.getText(context.sourceFile),
      location
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitParameter(
    node: ts.ParameterDeclaration,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Parameter', {
      name: node.name.getText(context.sourceFile),
      location,
      metadata: {
        typeAnnotation: node.type ? this.getTypeText(node.type, context) : undefined,
        optional: !!node.questionToken,
        defaultValue: node.initializer ? node.initializer.getText(context.sourceFile) : undefined
      }
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitPropertyDeclaration(
    node: ts.PropertyDeclaration,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Property', {
      name: node.name.getText(context.sourceFile),
      location,
      metadata: {
        static: node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword),
        visibility: this.getVisibility(node.modifiers),
        readonly: node.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword),
        optional: !!node.questionToken,
        typeAnnotation: node.type ? this.getTypeText(node.type, context) : undefined
      }
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitBlock(
    node: ts.Block,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Block', {
      location
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitArrowFunction(
    node: ts.ArrowFunction,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Function', {
      name: 'arrow',
      location,
      metadata: {
        async: node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword),
        typeAnnotation: node.type ? this.getTypeText(node.type, context) : undefined
      }
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitEnumDeclaration(
    node: ts.EnumDeclaration,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    const semanticNode = createSemanticNode('Type', {
      name: node.name.text,
      location,
      metadata: {
        typeAnnotation: 'enum'
      }
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private visitJsxElement(
    node: ts.Node,
    context: VisitorContext,
    location: SourceLocation
  ): SemanticNode {
    let name = 'JSX'

    if (ts.isJsxElement(node)) {
      const tagName = node.openingElement.tagName
      name = tagName.getText(context.sourceFile)
    } else if (ts.isJsxSelfClosingElement(node)) {
      name = node.tagName.getText(context.sourceFile)
    } else if (ts.isJsxFragment(node)) {
      name = 'Fragment'
    }

    const semanticNode = createSemanticNode('Expression', {
      name: `<${name}>`,
      location
    })

    if (context.parent) {
      addChild(context.parent, semanticNode)
    }

    return semanticNode
  }

  private getLocation(node: ts.Node, context: VisitorContext): SourceLocation {
    const start = context.sourceFile.getLineAndCharacterOfPosition(node.getStart())
    const end = context.sourceFile.getLineAndCharacterOfPosition(node.getEnd())

    return {
      file: context.filename,
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

  private getTypeText(typeNode: ts.TypeNode, context: VisitorContext): string {
    return typeNode.getText(context.sourceFile)
  }

  private getVisibility(modifiers?: ts.NodeArray<ts.ModifierLike>): 'public' | 'private' | 'protected' | undefined {
    if (!modifiers) return undefined

    if (modifiers.some(m => m.kind === ts.SyntaxKind.PrivateKeyword)) {
      return 'private'
    }
    if (modifiers.some(m => m.kind === ts.SyntaxKind.ProtectedKeyword)) {
      return 'protected'
    }
    if (modifiers.some(m => m.kind === ts.SyntaxKind.PublicKeyword)) {
      return 'public'
    }

    return undefined
  }
}
