import { Project, SyntaxKind, ts } from 'ts-morph';
import { processJsxNode, isJsxNode, getJsxFromExpression } from './jsxHandler';

export interface SemanticNode {
  type: string;
  name?: string;
  children: SemanticNode[];
  metadata: Record<string, any>;
  indent: number;
  sourceStartLine: number;
  sourceEndLine: number;
}

function getNodeLineRange(node: { getStartLineNumber(): number; getEndLineNumber(): number }): { start: number; end: number } {
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

export function makeSemanticGraph(sourceFile: ts.SourceFile): SemanticNode[] {
  const project = new Project({ useInMemoryFileSystem: true });
  const morphSourceFile = project.createSourceFile(
    sourceFile.fileName,
    sourceFile.getFullText(),
  );

  const out: SemanticNode[] = [];
  for (const stmt of morphSourceFile.getStatements()) {
    out.push(...processStatement(stmt, 0, morphSourceFile));
  }
  return out;
}

function processStatement(node: any, indent: number, sourceFile: any): SemanticNode[] {
  const kind = node.getKind();

  if (kind === SyntaxKind.ImportDeclaration) {
    return [processImport(node, indent)];
  }
  if (kind === SyntaxKind.ExportDeclaration) {
    return [processExport(node, indent)];
  }
  if (kind === SyntaxKind.FunctionDeclaration) {
    return [processFunction(node, indent, sourceFile)];
  }
  if (kind === SyntaxKind.ClassDeclaration) {
    return [processClass(node, indent, sourceFile)];
  }
  if (kind === SyntaxKind.InterfaceDeclaration) {
    return [processInterface(node, indent, sourceFile)];
  }
  if (kind === SyntaxKind.TypeAliasDeclaration) {
    return [processTypeAlias(node, indent, sourceFile)];
  }
  if (kind === SyntaxKind.VariableStatement) {
    const nodes: SemanticNode[] = [];
    for (const decl of node.getDeclarationList().getDeclarations()) {
      nodes.push(...processVariableDeclaration(decl, indent, sourceFile));
    }
    return nodes;
  }
  if (kind === SyntaxKind.ReturnStatement) {
    return [processReturn(node, indent, sourceFile)];
  }
  if (kind === SyntaxKind.IfStatement) {
    return [processIf(node, indent, sourceFile)];
  }
  if (kind === SyntaxKind.ForStatement || kind === SyntaxKind.ForOfStatement || kind === SyntaxKind.ForInStatement) {
    return [processLoop(node, indent, sourceFile)];
  }
  if (kind === SyntaxKind.WhileStatement || kind === SyntaxKind.DoStatement) {
    return [processWhile(node, indent, sourceFile)];
  }
  if (kind === SyntaxKind.Block) {
    return processBlock(node, indent, sourceFile);
  }
  if (kind === SyntaxKind.ExpressionStatement) {
    return processExpressionStatement(node, indent, sourceFile);
  }
  if (isJsxNode(node)) {
    const result = processJsxNode(node, indent, sourceFile);
    return result ? [result] : [];
  }
  return [];
}

function processBlock(block: any, indent: number, sourceFile: any): SemanticNode[] {
  const out: SemanticNode[] = [];
  for (const stmt of block.getStatements()) {
    out.push(...processStatement(stmt, indent, sourceFile));
  }
  return out;
}

function processImport(node: any, indent: number): SemanticNode {
  const moduleSpecifier = node.getModuleSpecifier().getText();
  const importClause = node.getImportClause();

  let importedNames: string[] = [];

  if (importClause) {
    const defaultImport = importClause.getDefaultImport();
    if (defaultImport) {
      importedNames.push(defaultImport.getText());
    }
    const namedImports = importClause.getNamedImports();
    for (const el of namedImports) {
      importedNames.push(el.getName());
    }
  }

  const lines = getNodeLineRange(node);
  return makeNode('import', importedNames.join(', '), lines, indent, {
    module: moduleSpecifier.replace(/['"]/g, ''),
    importedNames,
  });
}

function processExport(node: any, indent: number): SemanticNode {
  const moduleSpecifier = node.getModuleSpecifier()?.getText().replace(/['"]/g, '') || '';
  const exportClause = node.getExportClause();
  let exportedNames: string[] = [];

  if (exportClause && exportClause.getElements) {
    for (const el of exportClause.getElements()) {
      exportedNames.push(el.getName().getText());
    }
  }

  const lines = getNodeLineRange(node);
  return makeNode('export', exportedNames.join(', '), lines, indent, {
    module: moduleSpecifier,
    exportedNames,
  });
}

function processFunction(node: any, indent: number, sourceFile: any): SemanticNode {
  const name = node.getName() || 'anonymous';
  const params = node.getParameters().map((p: any) => p.getName());
  const body = node.getBody();
  const children = body ? processBlock(body, indent + 1, sourceFile) : [];
  const lines = getNodeLineRange(node);
  return makeNode('function', name, lines, indent, {
    parameters: params,
    returnType: node.getReturnType().getText() || 'void',
  }, children);
}

function processClass(node: any, indent: number, sourceFile: any): SemanticNode {
  const name = node.getName() || 'anonymous';
  const children: SemanticNode[] = [];

  for (const member of node.getMembers()) {
    const memberKind = member.getKind();
    if (memberKind === SyntaxKind.MethodDeclaration) {
      children.push(processMethod(member, indent + 1, sourceFile));
    } else if (memberKind === SyntaxKind.PropertyDeclaration) {
      children.push(processProperty(member, indent + 1, sourceFile));
    }
  }

  const lines = getNodeLineRange(node);
  const extendsClause = node.getExtendsHeritageClause();
  const extendsType = extendsClause?.getTypes()[0]?.getExpression().getText() || null;
  return makeNode('class', name, lines, indent, {
    extends: extendsType,
  }, children);
}

function processMethod(node: any, indent: number, sourceFile: any): SemanticNode {
  const name = node.getName();
  const params = node.getParameters().map((p: any) => p.getName());
  const body = node.getBody();
  const children = body ? processBlock(body, indent + 1, sourceFile) : [];
  const lines = getNodeLineRange(node);
  return makeNode('method', name, lines, indent, {
    parameters: params,
    returnType: node.getReturnType().getText() || 'void',
  }, children);
}

function processProperty(node: any, indent: number, sourceFile: any): SemanticNode {
  const name = node.getName();
  const lines = getNodeLineRange(node);
  return makeNode('property', name, lines, indent, {
    type: node.getType().getText() || 'any',
    initializer: node.getInitializer()?.getText() || null,
  });
}

function processInterface(node: any, indent: number, sourceFile: any): SemanticNode {
  const name = node.getName();
  const children: SemanticNode[] = [];

  for (const member of node.getMembers()) {
    if (member.getKind() === SyntaxKind.PropertySignature) {
      const childLines = getNodeLineRange(member);
      children.push(makeNode('property', member.getName(), childLines, indent + 1, {
        type: member.getType().getText() || 'any',
        optional: !!member.compilerNode.questionToken,
      }));
    }
  }

  const lines = getNodeLineRange(node);
  return makeNode('interface', name, lines, indent, {}, children);
}

function processTypeAlias(node: any, indent: number, sourceFile: any): SemanticNode {
  const lines = getNodeLineRange(node);
  return makeNode('typeAlias', node.getName().getText(), lines, indent, {
    type: node.getType().getText(),
  });
}

function processVariableDeclaration(
  decl: any,
  indent: number,
  sourceFile: any,
): SemanticNode[] {
  const name = decl.getName();
  const lines = getNodeLineRange(decl);
  const initializer = decl.getInitializer();
  const nameNode = decl.getNameNode();
  const isArrayDestructure = nameNode.getKind() === SyntaxKind.ArrayBindingPattern;
  const isObjectDestructure = nameNode.getKind() === SyntaxKind.ObjectBindingPattern;
  const isDestructured = isArrayDestructure || isObjectDestructure;
  const names = extractBindingNames(nameNode);

  if (initializer) {
    const unwrapped = unwrapExpression(initializer);
    const unwrappedKind = unwrapped.getKind();
    if (unwrappedKind === SyntaxKind.ArrowFunction || unwrappedKind === SyntaxKind.FunctionExpression) {
      const fn = processArrowFunction(unwrapped, indent, sourceFile);
      const fnLines = lines;
      const fnMeta = { ...fn.metadata, anonymous: false };
      return [makeNode('function', name, fnLines, indent, fnMeta, fn.children)];
    }
  }

  const child = initializer ? processExpression(initializer, indent + 1, sourceFile) : null;
  let children = child ? [child] : [];
  const initText = child ? null : (initializer ? truncate(initializer.getText()) : null);
  const metadata: Record<string, any> = {
    type: decl.getType().getText() || 'any',
    initializer: initText,
  };

  if (isDestructured) {
    metadata.destructured = true;
    metadata.destructureKind = isArrayDestructure ? 'array' : 'object';
    metadata.names = names;
    if (child && child.type === 'call') {
      metadata.initializer = null;
      metadata.initializerCall = {
        function: child.metadata.function,
        arguments: child.metadata.arguments,
        argCount: child.metadata.argCount,
        isNew: child.metadata.isNew,
      };
      children = [];
    }
  }

  return [makeNode('variable', name, lines, indent, metadata, children)];
}

function processReturn(node: any, indent: number, sourceFile: any): SemanticNode {
  const children: SemanticNode[] = [];
  let hasJsx = false;

  const expression = node.getExpression();
  const jsxNode = getJsxFromExpression(expression);
  if (jsxNode) {
    hasJsx = true;
    const result = processJsxNode(jsxNode, indent + 1, sourceFile);
    if (result) children.push(result);
  }

  const lines = getNodeLineRange(node);
  return makeNode('return', undefined, lines, indent, {
    value: hasJsx ? null : (expression ? truncate(expression.getText()) : null),
    hasJsx,
  }, children);
}

function processIf(node: any, indent: number, sourceFile: any): SemanticNode {
  const children: SemanticNode[] = [];
  children.push(...processBody(node.getThenStatement(), indent + 1, sourceFile));
  const elseStatement = node.getElseStatement();
  if (elseStatement) {
    if (elseStatement.getKind() === SyntaxKind.IfStatement) {
      children.push(...processIf(elseStatement, indent + 1, sourceFile));
    } else {
      children.push(...processBody(elseStatement, indent + 1, sourceFile));
    }
  }

  const lines = getNodeLineRange(node);
  return makeNode('if', undefined, lines, indent, {
    condition: truncate(node.getExpression().getText()),
    hasElse: !!elseStatement,
  }, children);
}

function processLoop(
  node: any,
  indent: number,
  sourceFile: any,
): SemanticNode {
  const statement = node.getStatement();
  const children = processBody(statement, indent + 1, sourceFile);
  const lines = getNodeLineRange(node);
  const kind = node.getKind();
  let loopType = 'for';
  if (kind === SyntaxKind.ForOfStatement) loopType = 'forOf';
  else if (kind === SyntaxKind.ForInStatement) loopType = 'forIn';

  return makeNode('loop', undefined, lines, indent, {
    loopType,
    condition: truncate(node.getText().split('{')[0] || ''),
  }, children);
}

function processWhile(node: any, indent: number, sourceFile: any): SemanticNode {
  const statement = node.getStatement();
  const children = processBody(statement, indent + 1, sourceFile);
  const lines = getNodeLineRange(node);
  return makeNode('loop', undefined, lines, indent, {
    loopType: 'while',
    condition: truncate(node.getExpression().getText()),
  }, children);
}

function processBody(body: any, indent: number, sourceFile: any): SemanticNode[] {
  if (!body) return [];
  if (body.getKind() === SyntaxKind.Block) return processBlock(body, indent, sourceFile);
  return processStatement(body, indent, sourceFile);
}

function processExpressionStatement(node: any, indent: number, sourceFile: any): SemanticNode[] {
  const expr = node.getExpression();
  if (isJsxNode(expr)) {
    const result = processJsxNode(expr, indent, sourceFile);
    return result ? [result] : [];
  }
  const child = processExpression(expr, indent, sourceFile);
  return child ? [child] : [];
}

function processExpression(expr: any, indent: number, sourceFile: any): SemanticNode | null {
  const unwrapped = unwrapExpression(expr);
  if (isJsxNode(unwrapped)) {
    return processJsxNode(unwrapped, indent, sourceFile);
  }
  const exprKind = unwrapped.getKind();
  if (exprKind === SyntaxKind.CallExpression || exprKind === SyntaxKind.NewExpression) {
    return processCall(unwrapped, indent, sourceFile);
  }
  if (exprKind === SyntaxKind.ArrowFunction || exprKind === SyntaxKind.FunctionExpression) {
    return processArrowFunction(unwrapped, indent, sourceFile);
  }
  return null;
}

function processCall(
  node: any,
  indent: number,
  sourceFile: any,
): SemanticNode {
  const isNew = node.getKind() === SyntaxKind.NewExpression;
  const callee = node.getExpression();
  const calleeText = truncate(callee.getText(), 100);
  const args = node.getArguments() ?? [];
  const children: SemanticNode[] = [];
  const argSummaries: string[] = [];

  for (const arg of args) {
    const unwrapped = unwrapExpression(arg);
    const unwrappedKind = unwrapped.getKind();
    if ((unwrappedKind === SyntaxKind.ArrowFunction || unwrappedKind === SyntaxKind.FunctionExpression)) {
      const body = unwrapped.getBody();
      if (body && body.getKind() === SyntaxKind.Block) {
        const child = processArrowFunction(unwrapped, indent + 1, sourceFile);
        if (child) {
          children.push(child);
          argSummaries.push('<function>');
          continue;
        }
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
  node: any,
  indent: number,
  sourceFile: any,
): SemanticNode {
  const params = node.getParameters().map((p: any) => summarizeParamName(p));
  const children: SemanticNode[] = [];
  const body = node.getBody();
  if (body) {
    if (body.getKind() === SyntaxKind.Block) {
      children.push(...processBlock(body, indent + 1, sourceFile));
    } else {
      const ret = processImplicitReturn(body, indent + 1, sourceFile);
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

function processImplicitReturn(expr: any, indent: number, sourceFile: any): SemanticNode | null {
  const children: SemanticNode[] = [];
  let hasJsx = false;

  const jsxNode = getJsxFromExpression(expr);
  if (jsxNode) {
    hasJsx = true;
    const result = processJsxNode(jsxNode, indent + 1, sourceFile);
    if (result) children.push(result);
  }

  const lines = getNodeLineRange(expr);
  return makeNode('return', undefined, lines, indent, {
    value: hasJsx ? null : (expr ? truncate(expr.getText()) : null),
    hasJsx,
  }, children);
}

function summarizeParamName(p: any, max = 80): string {
  const name = p.getNameNode();
  const kind = name.getKind();
  if (kind === SyntaxKind.ObjectBindingPattern || kind === SyntaxKind.ArrayBindingPattern) {
    const parts: string[] = [];
    for (const el of name.getElements()) {
      const propName = el.compilerNode.propertyName?.getText();
      const elName = el.getName();
      parts.push(propName ?? elName);
    }
    const joined = parts.join(', ');
    const summary = kind === SyntaxKind.ObjectBindingPattern ? `{ ${joined} }` : `[ ${joined} ]`;
    return truncate(summary, max);
  }
  return truncate(name.getText(), max);
}

function extractBindingNames(name: any): string[] {
  const kind = name.getKind();
  if (kind === SyntaxKind.ObjectBindingPattern || kind === SyntaxKind.ArrayBindingPattern) {
    const names: string[] = [];
    for (const el of name.getElements()) {
      names.push(el.getName());
    }
    return names;
  }
  return [name.getText()];
}

function unwrapExpression(expr: any): any {
  let current = expr;
  let kind = current.getKind();
  while (kind === SyntaxKind.ParenthesizedExpression && current.getExpression()) {
    current = current.getExpression();
    kind = current.getKind();
  }
  return current;
}
