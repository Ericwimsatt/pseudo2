import { SourceFile, Node } from "ts-morph";
import type {
  ArrowFunction,
  Block,
  CallExpression,
  ClassDeclaration,
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
}

function getNodeLineRange(node: Node): { start: number; end: number } {
  return { start: node.getStartLineNumber(), end: node.getEndLineNumber() };
}

function truncate(text: string, max = 80): string {
  const single = text.replace(/\s+/g, ' ').trim();
  return single.length > max ? single.slice(0, max - 3) + '...' : single;
}

function makeNode(
  type: string,
  name: string | undefined,
  lines: { start: number; end: number },
  indent: number,
  metadata: Record<string, any> = {},
  children: SemanticNode[] = [],
): SemanticNode {
  return {
    type,
    name,
    children,
    metadata,
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end,
  };
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
    for (const decl of node.getDeclarationList().getDeclarations()) {
      nodes.push(...processVariableDeclaration(decl, indent));
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

  const lines = getNodeLineRange(node);
  return makeNode('import', importedNames.join(', '), lines, indent, {
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

  const lines = getNodeLineRange(node);
  return makeNode('export', exportedNames.join(', '), lines, indent, {
    module: moduleSpecifier,
    exportedNames,
  });
}

function processFunction(node: FunctionDeclaration, indent: number): SemanticNode {
  const name = node.getName() || 'anonymous';
  const params = node.getParameters().map(p => p.getName());
  const body = node.getBody();
  const children = body && Node.isBlock(body) ? processBlock(body, indent + 1) : [];
  const lines = getNodeLineRange(node);
  return makeNode('function', name, lines, indent, {
    parameters: params,
    returnType: node.getReturnType().getText() || 'void',
  }, children);
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
  const lines = getNodeLineRange(node);
  return makeNode('class', name, lines, indent, {
    extends: extendsClause ? extendsClause.getExpression().getText() : null,
  }, children);
}

function processMethod(node: MethodDeclaration, indent: number): SemanticNode {
  const name = node.getName();
  const params = node.getParameters().map(p => p.getName());
  const body = node.getBody();
  const children = body && Node.isBlock(body) ? processBlock(body, indent + 1) : [];
  const lines = getNodeLineRange(node);
  return makeNode('method', name, lines, indent, {
    parameters: params,
    returnType: node.getReturnType().getText() || 'void',
  }, children);
}

function processProperty(node: PropertyDeclaration, indent: number): SemanticNode {
  const name = node.getName();
  const lines = getNodeLineRange(node);
  return makeNode('property', name, lines, indent, {
    type: node.getType().getText() || 'any',
    initializer: node.getInitializer()?.getText() || null,
  });
}

function processInterface(node: InterfaceDeclaration, indent: number): SemanticNode {
  const name = node.getName();
  const children: SemanticNode[] = [];

  for (const member of node.getMembers()) {
    if (Node.isPropertySignature(member)) {
      const childLines = getNodeLineRange(member);
      children.push(makeNode('property', member.getName(), childLines, indent + 1, {
        type: member.getType().getText() || 'any',
        optional: member.hasQuestionToken(),
      }));
    }
  }

  const lines = getNodeLineRange(node);
  return makeNode('interface', name, lines, indent, {}, children);
}

function processTypeAlias(node: TypeAliasDeclaration, indent: number): SemanticNode {
  const lines = getNodeLineRange(node);
  return makeNode('typeAlias', node.getName(), lines, indent, {
    type: node.getType().getText(),
  });
}

function processVariableDeclaration(
  decl: VariableDeclaration,
  indent: number,
): SemanticNode[] {
  const name = decl.getName();
  const lines = getNodeLineRange(decl);
  const initializer = decl.getInitializer();

  if (initializer) {
    const unwrapped = unwrapExpression(initializer);
    if (Node.isArrowFunction(unwrapped) || Node.isFunctionExpression(unwrapped)) {
      const fn = processArrowFunction(unwrapped, indent);
      const fnLines = getNodeLineRange(decl);
      const fnMeta = { ...fn.metadata, anonymous: false };
      return [makeNode('function', name, fnLines, indent, fnMeta, fn.children)];
    }
  }

  const child = initializer ? processExpression(initializer, indent + 1) : null;
  const children = child ? [child] : [];
  const initText = child ? null : (initializer ? truncate(initializer.getText()) : null);
  return [makeNode('variable', name, lines, indent, {
    type: decl.getType().getText() || 'any',
    initializer: initText,
  }, children)];
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

  const lines = getNodeLineRange(node);
  return makeNode('return', undefined, lines, indent, {
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

  const lines = getNodeLineRange(node);
  return makeNode('if', undefined, lines, indent, {
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
  const lines = getNodeLineRange(node);
  const loopType = Node.isForStatement(node) ? 'for' : Node.isForOfStatement(node) ? 'forOf' : 'forIn';
  return makeNode('loop', undefined, lines, indent, {
    loopType,
    condition: truncate(node.getText().split('{')[0] || ''),
  }, children);
}

function processWhile(node: WhileStatement | DoStatement, indent: number): SemanticNode {
  const statement = node.getStatement();
  const children = processBody(statement, indent + 1);
  const lines = getNodeLineRange(node);
  return makeNode('loop', undefined, lines, indent, {
    loopType: 'while',
    condition: truncate(node.getExpression().getText()),
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

  const lines = getNodeLineRange(node);
  return makeNode('call', undefined, lines, indent, {
    function: calleeText,
    arguments: argSummaries,
    argCount: args.length,
    isNew,
  }, children);
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
  const lines = getNodeLineRange(node);
  return makeNode('function', undefined, lines, indent, {
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

  const lines = getNodeLineRange(expr);
  return makeNode('return', undefined, lines, indent, {
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
