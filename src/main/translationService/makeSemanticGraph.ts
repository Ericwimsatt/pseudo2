import { SourceFile, Node } from "ts-morph";
import type {
  ArrowFunction,
  Block,
  CallExpression,
  CaseClause,
  ClassDeclaration,
  DefaultClause,
  DoStatement,
  ExportDeclaration,
  ExpressionStatement,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  FunctionExpression,
  IfStatement,
  ImportDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  NewExpression,
  ParameterDeclaration,
  PropertyDeclaration,
  ReturnStatement,
  SwitchStatement,
  TypeAliasDeclaration,
  VariableDeclaration,
  WhileStatement,
} from "ts-morph";
import { isJsxNode, processJsxNode, getJsxFromExpression } from './jsxHandler';

export interface SemanticNode {
  type: string;
  name?: string;
  children: SemanticNode[];
  metadata: Record<string, any>;
  indent: number;
  sourceStartLine: number;
  sourceEndLine: number;
  /** 0-based character offset of the primary identifier for AST enrichment queries */
  refPos?: number;
}

function truncate(text: string, max = 80): string {
  const single = text.replace(/\s+/g, ' ').trim();
  return single.length > max ? single.slice(0, max - 3) + '...' : single;
}

function makeNodeFromAst(
  type: string,
  name: string | undefined,
  node: Node,
  indent: number,
  metadata: Record<string, any> = {},
  children: SemanticNode[] = [],
  refPos?: number,
): SemanticNode {
  return {
    type,
    name,
    children,
    metadata,
    indent,
    sourceStartLine: node.getStartLineNumber(),
    sourceEndLine: node.getEndLineNumber(),
    refPos,
  };
}

/** Resolve the primary-identifier offset for a node, based on its semantic type. */
function getIdentifierPos(node: Node, type: string): number | undefined {
  try {
    switch (type) {
      case 'variable':
        return (node as import('ts-morph').VariableDeclaration).getNameNode().getStart();
      case 'function':
      case 'method':
        return (node as import('ts-morph').FunctionDeclaration | import('ts-morph').MethodDeclaration).getNameNode()?.getStart();
      case 'class':
        return (node as import('ts-morph').ClassDeclaration).getNameNode()?.getStart();
      case 'interface':
        return (node as import('ts-morph').InterfaceDeclaration).getNameNode()?.getStart();
      case 'typeAlias':
        return (node as import('ts-morph').TypeAliasDeclaration).getNameNode()?.getStart();
      case 'property':
        return (node as import('ts-morph').PropertyDeclaration | import('ts-morph').PropertySignature).getNameNode().getStart();
      case 'call': {
        const callee = (node as import('ts-morph').CallExpression).getExpression();
        if (Node.isIdentifier(callee)) return callee.getStart();
        if (Node.isPropertyAccessExpression(callee)) return callee.getNameNode().getStart();
        return callee.getStart();
      }
      case 'import':
      case 'export':
        return node.getStart();
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

export function makeSemanticGraph(sourceFile: SourceFile): SemanticNode[] {
  const out: SemanticNode[] = [];
  for (const stmt of sourceFile.getStatements()) {
    out.push(...processStatement(stmt, 0));
  }
  return out;
}

function processStatement(node: Node, indent: number): SemanticNode[] {
  if (Node.isImportDeclaration(node)) {
    return [processImport(node, indent)];
  }
  if (Node.isExportDeclaration(node)) {
    return [processExport(node, indent)];
  }
  if (Node.isFunctionDeclaration(node)) {
    return [processFunction(node, indent)];
  }
  if (Node.isClassDeclaration(node)) {
    return [processClass(node, indent)];
  }
  if (Node.isInterfaceDeclaration(node)) {
    return [processInterface(node, indent)];
  }
  if (Node.isTypeAliasDeclaration(node)) {
    return [processTypeAlias(node, indent)];
  }
  if (Node.isVariableStatement(node)) {
    const nodes: SemanticNode[] = [];
    const exported = node.hasExportKeyword();
    for (const decl of node.getDeclarationList().getDeclarations()) {
      nodes.push(...processVariableDeclaration(decl, indent, exported));
    }
    return nodes;
  }
  if (Node.isReturnStatement(node)) {
    return [processReturn(node, indent)];
  }
  if (Node.isIfStatement(node)) {
    return [processIf(node, indent)];
  }
  if (Node.isForStatement(node) || Node.isForOfStatement(node) || Node.isForInStatement(node)) {
    return [processLoop(node, indent)];
  }
  if (Node.isWhileStatement(node) || Node.isDoStatement(node)) {
    return [processWhile(node, indent)];
  }
  if (Node.isSwitchStatement(node)) {
    return [processSwitch(node, indent)];
  }
  if (Node.isBlock(node)) {
    return processBlock(node, indent);
  }
  if (Node.isExpressionStatement(node)) {
    return processExpressionStatement(node, indent);
  }
  if (isJsxNode(node)) {
    const result = processJsxNode(node, indent);
    return result ? [result] : [];
  }
  return [];
}

function processBlock(block: Block, indent: number): SemanticNode[] {
  const out: SemanticNode[] = [];
  for (const stmt of block.getStatements()) {
    out.push(...processStatement(stmt, indent));
  }
  return out;
}

function processImport(node: ImportDeclaration, indent: number): SemanticNode {
  const moduleSpecifier = node.getModuleSpecifier().getText();
  const importClause = node.getImportClause();
  let importedNames: string[] = [];

  if (importClause) {
    const defaultName = importClause.compilerNode.name?.getText();
    if (defaultName) {
      importedNames.push(defaultName);
    }
    if (importClause.getNamedBindings()) {
      const namedBindings = importClause.getNamedBindings()!;
      if (Node.isNamedImports(namedBindings)) {
        namedBindings.getElements().forEach(el => {
          importedNames.push(el.getName());
        });
      }
    }
  }

  return makeNodeFromAst('import', importedNames.join(', '), node, indent, {
    module: moduleSpecifier.replace(/['"]/g, ''),
    importedNames,
  });
}

function processExport(node: ExportDeclaration, indent: number): SemanticNode {
  const moduleSpecifier = node.getModuleSpecifier()?.getText().replace(/['"]/g, '') || '';
  let exportedNames: string[] = [];

  if (node.hasNamedExports()) {
    node.getNamedExports().forEach(el => {
      exportedNames.push(el.getName());
    });
  }

  return makeNodeFromAst('export', exportedNames.join(', '), node, indent, {
    module: moduleSpecifier,
    exportedNames,
  });
}

function processFunction(node: FunctionDeclaration, indent: number): SemanticNode {
  const name = node.getName() || 'anonymous';
  const params = node.getParameters().map(p => p.getName());
  const body = node.getBody();
  const children = body && Node.isBlock(body) ? processBlock(body, indent + 1) : [];
  return makeNodeFromAst('function', name, node, indent, {
    parameters: params,
    returnType: node.getReturnType().getText() || 'void',
    exported: node.hasExportKeyword(),
  }, children, getIdentifierPos(node, 'function'));
}

function processClass(node: ClassDeclaration, indent: number): SemanticNode {
  const name = node.getName() || 'anonymous';
  const children: SemanticNode[] = [];

  for (const member of node.getMembers()) {
    if (Node.isMethodDeclaration(member)) {
      children.push(processMethod(member, indent + 1));
    } else if (Node.isPropertyDeclaration(member)) {
      children.push(processProperty(member, indent + 1));
    }
  }

  const extendsClause = node.getExtends();
  return makeNodeFromAst('class', name, node, indent, {
    extends: extendsClause ? extendsClause.getExpression().getText() : null,
    exported: node.hasExportKeyword(),
  }, children, getIdentifierPos(node, 'class'));
}

function processMethod(node: MethodDeclaration, indent: number): SemanticNode {
  const name = node.getName();
  const params = node.getParameters().map(p => p.getName());
  const body = node.getBody();
  const children = body && Node.isBlock(body) ? processBlock(body, indent + 1) : [];
  return makeNodeFromAst('method', name, node, indent, {
    parameters: params,
    returnType: node.getReturnType().getText() || 'void',
  }, children, getIdentifierPos(node, 'method'));
}

function processProperty(node: PropertyDeclaration, indent: number): SemanticNode {
  const name = node.getName();
  return makeNodeFromAst('property', name, node, indent, {
    type: (node.getTypeNode()?.getText() ?? node.getType().getText()) || 'any',
    initializer: node.getInitializer()?.getText() || null,
  }, [], getIdentifierPos(node, 'property'));
}

function processInterface(node: InterfaceDeclaration, indent: number): SemanticNode {
  const name = node.getName();
  const children: SemanticNode[] = [];

  for (const member of node.getMembers()) {
    if (Node.isPropertySignature(member)) {
      children.push(makeNodeFromAst('property', member.getName(), member, indent + 1, {
        type: (member.getTypeNode()?.getText() ?? member.getType().getText()) || 'any',
        optional: member.hasQuestionToken(),
      }, [], getIdentifierPos(member, 'property')));
    }
  }

  return makeNodeFromAst('interface', name, node, indent, {
    exported: node.hasExportKeyword(),
  }, children, getIdentifierPos(node, 'interface'));
}

function processTypeAlias(node: TypeAliasDeclaration, indent: number): SemanticNode {
  return makeNodeFromAst('typeAlias', node.getName(), node, indent, {
    type: node.getTypeNode()?.getText() ?? node.getType().getText(),
    exported: node.hasExportKeyword(),
  }, [], getIdentifierPos(node, 'typeAlias'));
}

function processVariableDeclaration(
  decl: VariableDeclaration,
  indent: number,
  exported?: boolean,
): SemanticNode[] {
  const name = decl.getName();
  const initializer = decl.getInitializer();

  if (initializer) {
    const unwrapped = unwrapExpression(initializer);
    if (Node.isArrowFunction(unwrapped) || Node.isFunctionExpression(unwrapped)) {
      const fn = processArrowFunction(unwrapped, indent);
      const fnMeta = { ...fn.metadata, anonymous: false };
      return [makeNodeFromAst('function', name, decl, indent, fnMeta, fn.children, decl.getNameNode().getStart())];
    }
  }

  const child = initializer ? processExpression(initializer, indent + 1) : null;
  const children = child ? [child] : [];
  const initText = child ? null : (initializer ? truncate(initializer.getText()) : null);
  return [makeNodeFromAst('variable', name, decl, indent, {
    type: (decl.getTypeNode()?.getText() ?? decl.getType().getText()) || 'any',
    initializer: initText,
    exported: exported ?? false,
  }, children, decl.getNameNode().getStart())];
}

function processReturn(node: ReturnStatement, indent: number): SemanticNode {
  const children: SemanticNode[] = [];
  let hasJsx = false;

  const jsxNode = getJsxFromExpression(node.getExpression());
  if (jsxNode) {
    hasJsx = true;
    const result = processJsxNode(jsxNode, indent + 1);
    if (result) children.push(result);
  }

  return makeNodeFromAst('return', undefined, node, indent, {
    value: hasJsx ? null : (node.getExpression() ? truncate(node.getExpression()!.getText()) : null),
    hasJsx,
  }, children);
}

function processIf(node: IfStatement, indent: number): SemanticNode {
  const children: SemanticNode[] = [];
  children.push(...processBody(node.getThenStatement(), indent + 1));
  const elseStatement = node.getElseStatement();
  if (elseStatement) {
    if (Node.isIfStatement(elseStatement)) {
      children.push(processIf(elseStatement, indent + 1));
    } else {
      children.push(...processBody(elseStatement, indent + 1));
    }
  }

  return makeNodeFromAst('if', undefined, node, indent, {
    condition: truncate(node.getExpression().getText()),
    hasElse: !!elseStatement,
  }, children);
}

function processLoop(
  node: ForStatement | ForOfStatement | ForInStatement,
  indent: number,
): SemanticNode {
  const statement = node.getStatement();
  const children = processBody(statement, indent + 1);
  const loopType = Node.isForStatement(node) ? 'for' : Node.isForOfStatement(node) ? 'forOf' : 'forIn';
  return makeNodeFromAst('loop', undefined, node, indent, {
    loopType,
    condition: truncate(node.getText().split('{')[0] || ''),
  }, children);
}

function processWhile(node: WhileStatement | DoStatement, indent: number): SemanticNode {
  const statement = node.getStatement();
  const children = processBody(statement, indent + 1);
  return makeNodeFromAst('loop', undefined, node, indent, {
    loopType: 'while',
    condition: truncate(node.getExpression().getText()),
  }, children);
}

function processCaseBody(
  clause: CaseClause | DefaultClause,
  indent: number,
): SemanticNode[] {
  const nodes: SemanticNode[] = [];
  for (const stmt of clause.getStatements()) {
    nodes.push(...processStatement(stmt, indent));
  }
  return nodes;
}

function processSwitch(node: SwitchStatement, indent: number): SemanticNode {
  const expression = truncate(node.getExpression().getText());
  const clauses = node.getCaseBlock().getClauses();

  if (clauses.length === 0) {
    return makeNodeFromAst('if', undefined, node, indent, {
      condition: expression,
      hasElse: false,
    }, []);
  }

  const first = clauses[0];
  const rest = clauses.slice(1);
  const firstBody = processCaseBody(first, indent + 1);
  const restChain = buildSwitchChain(rest, expression, indent + 1);

  if (Node.isDefaultClause(first)) {
    const children = restChain ? [...firstBody, restChain] : firstBody;
    return makeNodeFromAst('otherwise', undefined, node, indent, {}, children);
  }

  const label = truncate(first.getExpression().getText());
  const condition = `${expression} === ${label}`;
  const children = restChain ? [...firstBody, restChain] : firstBody;
  return makeNodeFromAst('if', undefined, node, indent, {
    condition,
    hasElse: !!restChain,
  }, children);
}

function buildSwitchChain(
  clauses: (CaseClause | DefaultClause)[],
  expression: string,
  indent: number,
): SemanticNode | null {
  if (clauses.length === 0) return null;
  const clause = clauses[0];
  const rest = clauses.slice(1);
  const body = processCaseBody(clause, indent + 1);
  const next = buildSwitchChain(rest, expression, indent + 1);
  const children = next ? [...body, next] : body;

  if (Node.isDefaultClause(clause)) {
    return makeNodeFromAst('otherwise', undefined, clause, indent, {}, children);
  }
  const label = truncate(clause.getExpression().getText());
  const condition = `${expression} === ${label}`;
  return makeNodeFromAst('otherwise-if', undefined, clause, indent, {
    condition,
    hasElse: !!next,
  }, children);
}

function processBody(body: Node | undefined, indent: number): SemanticNode[] {
  if (!body) return [];
  if (Node.isBlock(body)) return processBlock(body, indent);
  return processStatement(body, indent);
}

function processExpressionStatement(node: ExpressionStatement, indent: number): SemanticNode[] {
  const expr = node.getExpression();
  if (isJsxNode(expr)) {
    const result = processJsxNode(expr, indent);
    return result ? [result] : [];
  }
  const child = processExpression(expr, indent);
  return child ? [child] : [];
}

function processExpression(expr: Node, indent: number): SemanticNode | null {
  const unwrapped = unwrapExpression(expr);
  if (isJsxNode(unwrapped)) {
    return processJsxNode(unwrapped, indent);
  }
  if (Node.isCallExpression(unwrapped) || Node.isNewExpression(unwrapped)) {
    return processCall(unwrapped, indent);
  }
  if (Node.isArrowFunction(unwrapped) || Node.isFunctionExpression(unwrapped)) {
    return processArrowFunction(unwrapped, indent);
  }
  return null;
}

function processCall(
  node: CallExpression | NewExpression,
  indent: number,
): SemanticNode {
  const isNew = Node.isNewExpression(node);
  const callee = node.getExpression();
  const calleeText = truncate(callee.getText(), 100);
  const args = node.getArguments() ?? [];
  const children: SemanticNode[] = [];
  const argSummaries: string[] = [];

  for (const arg of args) {
    const unwrapped = unwrapExpression(arg);
    if ((Node.isArrowFunction(unwrapped) || Node.isFunctionExpression(unwrapped)) && Node.isBlock(unwrapped.getBody())) {
      const child = processArrowFunction(unwrapped, indent + 1);
      if (child) {
        children.push(child);
        argSummaries.push('<function>');
        continue;
      }
    }
    argSummaries.push(truncate(arg.getText(), 80));
  }

  return makeNodeFromAst('call', undefined, node, indent, {
    function: calleeText,
    arguments: argSummaries,
    argCount: args.length,
    isNew,
  }, children, getIdentifierPos(node, 'call'));
}

function processArrowFunction(
  node: ArrowFunction | FunctionExpression,
  indent: number,
): SemanticNode {
  const params = node.getParameters().map(p => summarizeParamName(p));
  const children: SemanticNode[] = [];
  const body = node.getBody();
  if (body) {
    if (Node.isBlock(body)) {
      children.push(...processBlock(body, indent + 1));
    } else {
      const ret = processImplicitReturn(body, indent + 1);
      if (ret) children.push(ret);
    }
  }
  return makeNodeFromAst('function', undefined, node, indent, {
    parameters: params,
    returnType: node.getReturnType().getText() || 'void',
    anonymous: true,
  }, children);
}

function processImplicitReturn(expr: Node, indent: number): SemanticNode | null {
  const children: SemanticNode[] = [];
  let hasJsx = false;

  const jsxNode = getJsxFromExpression(expr);
  if (jsxNode) {
    hasJsx = true;
    const result = processJsxNode(jsxNode, indent + 1);
    if (result) children.push(result);
  }

  return makeNodeFromAst('return', undefined, expr, indent, {
    value: hasJsx ? null : (expr ? truncate(expr.getText()) : null),
    hasJsx,
  }, children);
}

function summarizeParamName(p: ParameterDeclaration, max = 80): string {
  const nameNode = p.getNameNode();
  if (Node.isObjectBindingPattern(nameNode) || Node.isArrayBindingPattern(nameNode)) {
    const parts: string[] = [];
    for (const el of nameNode.getElements()) {
      if (Node.isBindingElement(el)) {
        const propName = el.compilerNode.propertyName?.getText() || el.getNameNode().getText();
        parts.push(propName);
      }
    }
    const joined = parts.join(', ');
    const summary = Node.isObjectBindingPattern(nameNode) ? `{ ${joined} }` : `[ ${joined} ]`;
    return truncate(summary, max);
  }
  return truncate(nameNode.getText(), max);
}

function unwrapExpression(expr: Node): Node {
  let current = expr;
  while (Node.isParenthesizedExpression(current) && current.getExpression()) {
    current = current.getExpression()!;
  }
  return current;
}
