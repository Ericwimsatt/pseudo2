import type {
  SemanticNode,
  PseudoCodeBlock,
  PseudoCodeLine
} from '@pseudo2/shared'
import { generateId } from '@pseudo2/shared'
import type { Renderer, RenderContext, RenderOptions } from '../types'

export class PseudoCodeRenderer implements Renderer {
  private options: RenderOptions

  constructor(options: RenderOptions = {}) {
    this.options = {
      maxDepth: 100,
      includeComments: true,
      includeTypes: true,
      simplifyExpressions: true,
      ...options
    }
  }

  render(nodes: SemanticNode[]): PseudoCodeBlock {
    const lines: PseudoCodeLine[] = []
    const context: RenderContext = { indent: 0, depth: 0 }

    for (const node of nodes) {
      this.renderNode(node, context, lines)
    }

    return { lines }
  }

  private renderNode(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    if (context.depth >= (this.options.maxDepth || 100)) {
      return
    }

    const renderer = this.getNodeRenderer(node.type)
    if (renderer) {
      renderer(node, context, lines)
    } else {
      this.renderDefault(node, context, lines)
    }
  }

  private getNodeRenderer(
    type: string
  ): ((node: SemanticNode, context: RenderContext, lines: PseudoCodeLine[]) => void) | null {
    const renderers: Record<string, (node: SemanticNode, context: RenderContext, lines: PseudoCodeLine[]) => void> = {
      Function: this.renderFunction.bind(this),
      Class: this.renderClass.bind(this),
      Method: this.renderMethod.bind(this),
      Variable: this.renderVariable.bind(this),
      Loop: this.renderLoop.bind(this),
      Conditional: this.renderConditional.bind(this),
      Return: this.renderReturn.bind(this),
      Assignment: this.renderAssignment.bind(this),
      Import: this.renderImport.bind(this),
      Export: this.renderExport.bind(this),
      Interface: this.renderInterface.bind(this),
      Type: this.renderType.bind(this),
      Call: this.renderCall.bind(this),
      Block: this.renderBlock.bind(this),
      Comment: this.renderComment.bind(this)
    }

    return renderers[type] || null
  }

  private renderFunction(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    const params = node.children
      .filter(c => c.type === 'Parameter')
      .map(p => p.name || 'param')
      .join(', ')

    const returnType = this.options.includeTypes && node.metadata.typeAnnotation
      ? ` -> ${node.metadata.typeAnnotation}`
      : ''

    const asyncPrefix = node.metadata.async ? 'async ' : ''

    lines.push({
      id: generateId('line'),
      content: `${asyncPrefix}function ${node.name || 'anonymous'}(${params})${returnType}`,
      indent: context.indent,
      nodes: [node]
    })

    this.renderChildren(node, { ...context, indent: context.indent + 1, depth: context.depth + 1 }, lines)
  }

  private renderClass(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    const extendsClause = node.relationships
      .filter(r => r.type === 'extends')
      .map(r => ` extends ${r.label || 'Base'}`)
      .join('')

    lines.push({
      id: generateId('line'),
      content: `class ${node.name || 'Anonymous'}${extendsClause}`,
      indent: context.indent,
      nodes: [node]
    })

    this.renderChildren(node, { ...context, indent: context.indent + 1, depth: context.depth + 1 }, lines)
  }

  private renderMethod(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    const params = node.children
      .filter(c => c.type === 'Parameter')
      .map(p => p.name || 'param')
      .join(', ')

    const visibility = node.metadata.visibility ? `${node.metadata.visibility} ` : ''
    const staticPrefix = node.metadata.static ? 'static ' : ''
    const asyncPrefix = node.metadata.async ? 'async ' : ''

    lines.push({
      id: generateId('line'),
      content: `${visibility}${staticPrefix}${asyncPrefix}${node.name || 'method'}(${params})`,
      indent: context.indent,
      nodes: [node]
    })

    this.renderChildren(node, { ...context, indent: context.indent + 1, depth: context.depth + 1 }, lines)
  }

  private renderVariable(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    const typeAnnotation = this.options.includeTypes && node.metadata.typeAnnotation
      ? `: ${node.metadata.typeAnnotation}`
      : ''

    const value = node.metadata.defaultValue ? ` = ${node.metadata.defaultValue}` : ''
    const readonly = node.metadata.readonly ? 'const ' : 'let '

    lines.push({
      id: generateId('line'),
      content: `${readonly}${node.name || 'variable'}${typeAnnotation}${value}`,
      indent: context.indent,
      nodes: [node]
    })
  }

  private renderLoop(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    const condition = node.metadata.condition || 'condition'
    lines.push({
      id: generateId('line'),
      content: `while ${condition}`,
      indent: context.indent,
      nodes: [node]
    })

    this.renderChildren(node, { ...context, indent: context.indent + 1, depth: context.depth + 1 }, lines)
  }

  private renderConditional(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    const condition = node.metadata.condition || 'condition'
    lines.push({
      id: generateId('line'),
      content: `if ${condition}`,
      indent: context.indent,
      nodes: [node]
    })

    this.renderChildren(node, { ...context, indent: context.indent + 1, depth: context.depth + 1 }, lines)
  }

  private renderReturn(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    const value = node.children.length > 0
      ? ` ${this.renderExpression(node.children[0])}`
      : ''

    lines.push({
      id: generateId('line'),
      content: `return${value}`,
      indent: context.indent,
      nodes: [node]
    })
  }

  private renderAssignment(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    const target = node.name || 'target'
    const value = node.children.length > 0
      ? this.renderExpression(node.children[0])
      : 'value'

    lines.push({
      id: generateId('line'),
      content: `${target} = ${value}`,
      indent: context.indent,
      nodes: [node]
    })
  }

  private renderImport(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    const imports = node.children
      .filter(c => c.type === 'Identifier')
      .map(c => c.name)
      .join(', ')

    const source = node.metadata.source || 'module'

    lines.push({
      id: generateId('line'),
      content: `import ${imports || '*'} from ${source}`,
      indent: context.indent,
      nodes: [node]
    })
  }

  private renderExport(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    if (node.children.length > 0) {
      lines.push({
        id: generateId('line'),
        content: 'export',
        indent: context.indent,
        nodes: [node]
      })

      this.renderChildren(node, { ...context, indent: context.indent, depth: context.depth + 1 }, lines)
    }
  }

  private renderInterface(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    lines.push({
      id: generateId('line'),
      content: `interface ${node.name || 'Anonymous'}`,
      indent: context.indent,
      nodes: [node]
    })

    this.renderChildren(node, { ...context, indent: context.indent + 1, depth: context.depth + 1 }, lines)
  }

  private renderType(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    lines.push({
      id: generateId('line'),
      content: `type ${node.name || 'Anonymous'} = ${node.metadata.typeAnnotation || 'unknown'}`,
      indent: context.indent,
      nodes: [node]
    })
  }

  private renderCall(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    const callee = node.name || 'function'
    const args = node.children
      .filter(c => c.type !== 'Identifier')
      .map(c => this.renderExpression(c))
      .join(', ')

    lines.push({
      id: generateId('line'),
      content: `${callee}(${args})`,
      indent: context.indent,
      nodes: [node]
    })
  }

  private renderBlock(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    this.renderChildren(node, context, lines)
  }

  private renderComment(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    if (!this.options.includeComments) return

    const text = node.metadata.text || node.name || ''
    lines.push({
      id: generateId('line'),
      content: `// ${text}`,
      indent: context.indent,
      nodes: [node]
    })
  }

  private renderDefault(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    lines.push({
      id: generateId('line'),
      content: `${node.type.toLowerCase()} ${node.name || ''}`.trim(),
      indent: context.indent,
      nodes: [node]
    })

    this.renderChildren(node, { ...context, indent: context.indent + 1, depth: context.depth + 1 }, lines)
  }

  private renderChildren(
    node: SemanticNode,
    context: RenderContext,
    lines: PseudoCodeLine[]
  ): void {
    for (const child of node.children) {
      this.renderNode(child, context, lines)
    }
  }

  private renderExpression(node: SemanticNode): string {
    if (node.type === 'Literal') {
      return String(node.metadata.value || node.name || 'value')
    }

    if (node.type === 'Identifier') {
      return node.name || 'identifier'
    }

    if (node.type === 'Binary') {
      const left = node.children[0] ? this.renderExpression(node.children[0]) : 'left'
      const right = node.children[1] ? this.renderExpression(node.children[1]) : 'right'
      const operator = node.metadata.operator || '+'
      return `${left} ${operator} ${right}`
    }

    if (node.type === 'Call') {
      const callee = node.name || 'function'
      const args = node.children.map(c => this.renderExpression(c)).join(', ')
      return `${callee}(${args})`
    }

    if (node.type === 'Member') {
      const object = node.children[0] ? this.renderExpression(node.children[0]) : 'object'
      const property = node.name || 'property'
      return `${object}.${property}`
    }

    return node.name || 'expression'
  }
}
