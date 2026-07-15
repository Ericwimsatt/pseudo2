import * as ts from 'typescript';
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

function getNodeLineRange(node: ts.Node, sourceFile: ts.SourceFile): { start: number; end: number } {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return { start: start.line + 1, end: end.line + 1 };
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

/**
 * Build a semantic graph that mirrors the AST's parent/child structure.
 *
 * The graph is a forest: each top-level statement becomes a root node, and
 * every node owns its children. Statement bodies (function/method/if/loop
 * bodies) are descended into explicitly; expression subtrees are only
 * descended into for block-bodied arrow/function arguments, so a single
 * call never explodes into many flat nodes. There is no generic
 * `forEachChild` re-descent, so a node is never emitted twice.
 */
export function makeSemanticGraph(sourceFile: ts.SourceFile): SemanticNode[] {
  const out: SemanticNode[] = [];
  for (const stmt of sourceFile.statements) {
    out.push(...processStatement(stmt, 0, sourceFile));
  }
  return out;
}

function processStatement(node: ts.Node, indent: number, sourceFile: ts.SourceFile): SemanticNode[] {
  if (ts.isImportDeclaration(node)) {
    return [processImport(node, indent, sourceFile)];
  }
  if (ts.isExportDeclaration(node)) {
    return [processExport(node, indent, sourceFile)];
  }
  if (ts.isFunctionDeclaration(node)) {
    return [processFunction(node, indent, sourceFile)];
  }
  if (ts.isClassDeclaration(node)) {
    return [processClass(node, indent, sourceFile)];
  }
  if (ts.isInterfaceDeclaration(node)) {
    return [processInterface(node, indent, sourceFile)];
  }
  if (ts.isTypeAliasDeclaration(node)) {
    return [processTypeAlias(node, indent, sourceFile)];
  }
  if (ts.isVariableStatement(node)) {
    const nodes: SemanticNode[] = [];
    for (const decl of node.declarationList.declarations) {
      nodes.push(...processVariableDeclaration(decl, indent, sourceFile));
    }
    return nodes;
  }
  if (ts.isReturnStatement(node)) {
    return [processReturn(node, indent, sourceFile)];
  }
  if (ts.isIfStatement(node)) {
    return [processIf(node, indent, sourceFile)];
  }
  if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) {
    return [processLoop(node, indent, sourceFile)];
  }
  if (ts.isWhileStatement(node) || ts.isDoStatement(node)) {
    return [processWhile(node, indent, sourceFile)];
  }
  if (ts.isBlock(node)) {
    return processBlock(node, indent, sourceFile);
  }
  if (ts.isExpressionStatement(node)) {
    return processExpressionStatement(node, indent, sourceFile);
  }
  if (isJsxNode(node)) {
    const result = processJsxNode(node, indent, sourceFile);
    return result ? [result] : [];
  }
  return [];
}

function processBlock(block: ts.Block, indent: number, sourceFile: ts.SourceFile): SemanticNode[] {
  const out: SemanticNode[] = [];
  for (const stmt of block.statements) {
    out.push(...processStatement(stmt, indent, sourceFile));
  }
  return out;
}

function processImport(node: ts.ImportDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const moduleSpecifier = node.moduleSpecifier.getText();
  const importClause = node.importClause;
  let importedNames: string[] = [];

  if (importClause) {
    if (importClause.name) {
      importedNames.push(importClause.name.text);
    }
    if (importClause.namedBindings) {
      if (ts.isNamedImports(importClause.namedBindings)) {
        importClause.namedBindings.elements.forEach(el => {
          importedNames.push(el.name.text);
        });
      }
    }
  }

  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('import', importedNames.join(', '), lines, indent, {
    module: moduleSpecifier.replace(/['"]/g, ''),
    importedNames,
  });
}

function processExport(node: ts.ExportDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const moduleSpecifier = node.moduleSpecifier?.getText().replace(/['"]/g, '') || '';
  const exportClause = node.exportClause;
  let exportedNames: string[] = [];

  if (exportClause && ts.isNamedExports(exportClause)) {
    exportClause.elements.forEach(el => {
      exportedNames.push(el.name.text);
    });
  }

  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('export', exportedNames.join(', '), lines, indent, {
    module: moduleSpecifier,
    exportedNames,
  });
}

function processFunction(node: ts.FunctionDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const name = node.name?.text || 'anonymous';
  const params = node.parameters.map(p => p.name.getText());
  const children = node.body ? processBlock(node.body, indent + 1, sourceFile) : [];
  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('function', name, lines, indent, {
    parameters: params,
    returnType: node.type?.getText() || 'void',
  }, children);
}

function processClass(node: ts.ClassDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const name = node.name?.text || 'anonymous';
  const children: SemanticNode[] = [];

  for (const member of node.members) {
    if (ts.isMethodDeclaration(member)) {
      children.push(processMethod(member, indent + 1, sourceFile));
    } else if (ts.isPropertyDeclaration(member)) {
      children.push(processProperty(member, indent + 1, sourceFile));
    }
  }

  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('class', name, lines, indent, {
    extends: node.heritageClauses?.[0]?.types[0]?.expression.getText() || null,
  }, children);
}

function processMethod(node: ts.MethodDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const name = node.name.getText();
  const params = node.parameters.map(p => p.name.getText());
  const children = node.body ? processBlock(node.body, indent + 1, sourceFile) : [];
  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('method', name, lines, indent, {
    parameters: params,
    returnType: node.type?.getText() || 'void',
  }, children);
}

function processProperty(node: ts.PropertyDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const name = node.name.getText();
  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('property', name, lines, indent, {
    type: node.type?.getText() || 'any',
    initializer: node.initializer?.getText() || null,
  });
}

function processInterface(node: ts.InterfaceDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const name = node.name.text;
  const children: SemanticNode[] = [];

  for (const member of node.members) {
    if (ts.isPropertySignature(member)) {
      const childLines = getNodeLineRange(member, sourceFile);
      children.push(makeNode('property', member.name.getText(), childLines, indent + 1, {
        type: member.type?.getText() || 'any',
        optional: !!member.questionToken,
      }));
    }
  }

  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('interface', name, lines, indent, {}, children);
}

function processTypeAlias(node: ts.TypeAliasDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('typeAlias', node.name.text, lines, indent, {
    type: node.type.getText(),
  });
}

function processVariableDeclaration(
  decl: ts.VariableDeclaration,
  indent: number,
  sourceFile: ts.SourceFile,
): SemanticNode[] {
  const name = decl.name.getText();
  const lines = getNodeLineRange(decl, sourceFile);
  const initializer = decl.initializer;

  if (initializer) {
    const unwrapped = unwrapExpression(initializer);
    if (ts.isArrowFunction(unwrapped) || ts.isFunctionExpression(unwrapped)) {
      const fn = processArrowFunction(unwrapped, indent, sourceFile);
      const fnLines = getNodeLineRange(decl, sourceFile);
      const fnMeta = { ...fn.metadata, anonymous: false };
      return [makeNode('function', name, fnLines, indent, fnMeta, fn.children)];
    }
  }

  const child = initializer ? processExpression(initializer, indent + 1, sourceFile) : null;
  const children = child ? [child] : [];
  const initText = child ? null : (initializer ? truncate(initializer.getText()) : null);
  return [makeNode('variable', name, lines, indent, {
    type: decl.type?.getText() || 'any',
    initializer: initText,
  }, children)];
}

function processReturn(node: ts.ReturnStatement, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const children: SemanticNode[] = [];
  let hasJsx = false;

  const jsxNode = getJsxFromExpression(node.expression);
  if (jsxNode) {
    hasJsx = true;
    const result = processJsxNode(jsxNode, indent + 1, sourceFile);
    if (result) children.push(result);
  }

  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('return', undefined, lines, indent, {
    value: hasJsx ? null : (node.expression ? truncate(node.expression.getText()) : null),
    hasJsx,
  }, children);
}

function processIf(node: ts.IfStatement, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const children: SemanticNode[] = [];
  children.push(...processBody(node.thenStatement, indent + 1, sourceFile));
  if (node.elseStatement) {
    if (ts.isIfStatement(node.elseStatement)) {
      children.push(...processIf(node.elseStatement, indent + 1, sourceFile));
    } else {
      children.push(...processBody(node.elseStatement, indent + 1, sourceFile));
    }
  }

  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('if', undefined, lines, indent, {
    condition: truncate(node.expression.getText()),
    hasElse: !!node.elseStatement,
  }, children);
}

function processLoop(
  node: ts.ForStatement | ts.ForOfStatement | ts.ForInStatement,
  indent: number,
  sourceFile: ts.SourceFile,
): SemanticNode {
  const statement = node.statement;
  const children = processBody(statement, indent + 1, sourceFile);
  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('loop', undefined, lines, indent, {
    loopType: ts.isForStatement(node) ? 'for' : ts.isForOfStatement(node) ? 'forOf' : 'forIn',
    condition: truncate(node.getText().split('{')[0] || ''),
  }, children);
}

function processWhile(node: ts.WhileStatement | ts.DoStatement, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const statement = ts.isWhileStatement(node) ? node.statement : node.statement;
  const children = processBody(statement, indent + 1, sourceFile);
  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('loop', undefined, lines, indent, {
    loopType: 'while',
    condition: truncate(node.expression.getText()),
  }, children);
}

function processBody(body: ts.Statement, indent: number, sourceFile: ts.SourceFile): SemanticNode[] {
  if (!body) return [];
  if (ts.isBlock(body)) return processBlock(body, indent, sourceFile);
  return processStatement(body, indent, sourceFile);
}

function processExpressionStatement(node: ts.ExpressionStatement, indent: number, sourceFile: ts.SourceFile): SemanticNode[] {
  const expr = node.expression;
  if (isJsxNode(expr)) {
    const result = processJsxNode(expr, indent, sourceFile);
    return result ? [result] : [];
  }
  const child = processExpression(expr, indent, sourceFile);
  return child ? [child] : [];
}

/**
 * Translate an expression into a single semantic node (with optional children
 * for block-bodied arrow/function arguments). Non-block arguments are kept
 * as short metadata text, so a call never explodes into many flat nodes.
 */
function processExpression(expr: ts.Expression, indent: number, sourceFile: ts.SourceFile): SemanticNode | null {
  const unwrapped = unwrapExpression(expr);
  if (isJsxNode(unwrapped)) {
    return processJsxNode(unwrapped, indent, sourceFile);
  }
  if (ts.isCallExpression(unwrapped) || ts.isNewExpression(unwrapped)) {
    return processCall(unwrapped, indent, sourceFile);
  }
  if (ts.isArrowFunction(unwrapped) || ts.isFunctionExpression(unwrapped)) {
    return processArrowFunction(unwrapped, indent, sourceFile);
  }
  return null;
}

function processCall(
  node: ts.CallExpression | ts.NewExpression,
  indent: number,
  sourceFile: ts.SourceFile,
): SemanticNode {
  const isNew = ts.isNewExpression(node);
  const callee = node.expression;
  const calleeText = truncate(callee.getText(), 100);
  const args = node.arguments ?? [];
  const children: SemanticNode[] = [];
  const argSummaries: string[] = [];

  for (const arg of args) {
    const unwrapped = unwrapExpression(arg);
    if ((ts.isArrowFunction(unwrapped) || ts.isFunctionExpression(unwrapped)) && ts.isBlock((unwrapped as ts.ArrowFunction | ts.FunctionExpression).body)) {
      const child = processArrowFunction(unwrapped as ts.ArrowFunction | ts.FunctionExpression, indent + 1, sourceFile);
      if (child) {
        children.push(child);
        argSummaries.push('<function>');
        continue;
      }
    }
    argSummaries.push(truncate(arg.getText(), 80));
  }

  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('call', undefined, lines, indent, {
    function: calleeText,
    arguments: argSummaries,
    argCount: args.length,
    isNew,
  }, children);
}

function processArrowFunction(
  node: ts.ArrowFunction | ts.FunctionExpression,
  indent: number,
  sourceFile: ts.SourceFile,
): SemanticNode {
  const params = node.parameters.map(p => summarizeParamName(p));
  const children: SemanticNode[] = [];
  if (node.body) {
    if (ts.isBlock(node.body)) {
      children.push(...processBlock(node.body, indent + 1, sourceFile));
    } else {
      // Expression body (e.g. `() => <div/>` or `() => value`). Wrap it in a
      // synthetic return node so the rendered tree mirrors the implicit
      // return and JSX bodies are picked up by processJsxNode.
      const ret = processImplicitReturn(node.body, indent + 1, sourceFile);
      if (ret) children.push(ret);
    }
  }
  const lines = getNodeLineRange(node, sourceFile);
  return makeNode('function', undefined, lines, indent, {
    parameters: params,
    returnType: node.type?.getText() || 'void',
    anonymous: true,
  }, children);
}

/**
 * Build a synthetic `return` node for an arrow/function-expression with a
 * non-block body. Mirrors processReturn so JSX expression bodies render as
 * nested JSX children and other expression bodies show as returned values.
 */
function processImplicitReturn(expr: ts.Expression, indent: number, sourceFile: ts.SourceFile): SemanticNode | null {
  const children: SemanticNode[] = [];
  let hasJsx = false;

  const jsxNode = getJsxFromExpression(expr);
  if (jsxNode) {
    hasJsx = true;
    const result = processJsxNode(jsxNode, indent + 1, sourceFile);
    if (result) children.push(result);
  }

  const lines = getNodeLineRange(expr, sourceFile);
  return makeNode('return', undefined, lines, indent, {
    value: hasJsx ? null : (expr ? truncate(expr.getText()) : null),
    hasJsx,
  }, children);
}

/**
 * Collapse a parameter name to a single line so destructured object patterns
 * (`{ a, b, c }`) don't dump their multi-line source into the translation.
 */
function summarizeParamName(p: ts.ParameterDeclaration, max = 80): string {
  const name = p.name;
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    const parts: string[] = [];
    for (const el of name.elements) {
      if (ts.isBindingElement(el)) {
        const propName = el.propertyName ? el.propertyName.getText() : el.name.getText();
        parts.push(propName);
      }
    }
    const joined = parts.join(', ');
    const summary = ts.isObjectBindingPattern(name) ? `{ ${joined} }` : `[ ${joined} ]`;
    return truncate(summary, max);
  }
  return truncate(p.name.getText(), max);
}

function unwrapExpression(expr: ts.Expression): ts.Expression {
  let current = expr;
  while (ts.isParenthesizedExpression(current) && current.expression) {
    current = current.expression;
  }
  return current;
}
