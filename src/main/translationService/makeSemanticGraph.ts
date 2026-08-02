import { SourceFile, Node } from "ts-morph";
import type {
  ArrowFunction,
  Block,
  CallExpression,
  CaseClause,
  ClassDeclaration,
  ConditionalExpression,
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
  sourceStartLine: number;
  sourceEndLine: number;
  /** 0-based character offset of the primary identifier for AST enrichment queries */
  refPos?: number;
}

function truncate(text: string, _max = 80): string {
  return text.replace(/\s+/g, ' ').trim();
}

function makeNodeOnLine(
  type: string,
  name: string | undefined,
  line: number,
  metadata: Record<string, any> = {},
): SemanticNode {
  return {
    type,
    name,
    children: [],
    metadata,
    sourceStartLine: line,
    sourceEndLine: line,
  };
}

function makeNodeFromAst(
  type: string,
  name: string | undefined,
  node: Node,
  metadata: Record<string, any> = {},
  children: SemanticNode[] = [],
  refPos?: number,
): SemanticNode {
  return {
    type,
    name,
    children,
    metadata,
    sourceStartLine: node.getStartLineNumber(),
    sourceEndLine: node.getEndLineNumber(),
    refPos,
  };
}

/** Resolve the primary-identifier offset for a node, based on its semantic type. */
function getIdentifierPos(node: Node, type: string): number | undefined {
  try {
    switch (type) {
      case 'variable-assignment':
        return (node as import('ts-morph').VariableDeclaration).getNameNode().getStart();
      case 'function-definition':
        return (node as any).getNameNode?.()?.getStart();
      case 'class':
        return (node as import('ts-morph').ClassDeclaration).getNameNode()?.getStart();
      case 'interface':
        return (node as import('ts-morph').InterfaceDeclaration).getNameNode()?.getStart();
      case 'typeAlias':
        return (node as import('ts-morph').TypeAliasDeclaration).getNameNode()?.getStart();
      case 'property':
        return (node as import('ts-morph').PropertyDeclaration | import('ts-morph').PropertySignature).getNameNode().getStart();
      case 'call-function': {
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
    out.push(...processStatement(stmt));
  }
  return out;
}

function processStatement(node: Node): SemanticNode[] {
  if (Node.isImportDeclaration(node)) {
    return [processImport(node)];
  }
  if (Node.isExportDeclaration(node)) {
    return [processExport(node)];
  }
  if (Node.isFunctionDeclaration(node)) {
    return [processFunctionDefinition(node)];
  }
  if (Node.isClassDeclaration(node)) {
    return [processClass(node)];
  }
  if (Node.isInterfaceDeclaration(node)) {
    return [processInterface(node)];
  }
  if (Node.isTypeAliasDeclaration(node)) {
    return [processTypeAlias(node)];
  }
  if (Node.isVariableStatement(node)) {
    const nodes: SemanticNode[] = [];
    const exported = node.hasExportKeyword();
    for (const decl of node.getDeclarationList().getDeclarations()) {
      nodes.push(...processVariableDeclaration(decl, exported));
    }
    return nodes;
  }
  if (Node.isReturnStatement(node)) {
    return [processReturn(node)];
  }
  if (Node.isIfStatement(node)) {
    return [processIf(node)];
  }
  if (Node.isForStatement(node) || Node.isForOfStatement(node) || Node.isForInStatement(node)) {
    return [processLoop(node)];
  }
  if (Node.isWhileStatement(node) || Node.isDoStatement(node)) {
    return [processWhile(node)];
  }
  if (Node.isSwitchStatement(node)) {
    return [processSwitch(node)];
  }
  if (Node.isBlock(node)) {
    return processBlock(node);
  }
  if (Node.isExpressionStatement(node)) {
    return processExpressionStatement(node);
  }
  if (isJsxNode(node)) {
    const result = processJsxNode(node);
    return result ? [result] : [];
  }
  return [];
}

function processBlock(block: Block): SemanticNode[] {
  const out: SemanticNode[] = [];
  for (const stmt of block.getStatements()) {
    out.push(...processStatement(stmt));
  }
  return out;
}

function processImport(node: ImportDeclaration): SemanticNode {
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

  return makeNodeFromAst('import', importedNames.join(', '), node, {
    module: moduleSpecifier.replace(/['"]/g, ''),
    importedNames,
  });
}

function processExport(node: ExportDeclaration): SemanticNode {
  const moduleSpecifier = node.getModuleSpecifier()?.getText().replace(/['"]/g, '') || '';
  let exportedNames: string[] = [];

  if (node.hasNamedExports()) {
    node.getNamedExports().forEach(el => {
      exportedNames.push(el.getName());
    });
  }

  return makeNodeFromAst('export', exportedNames.join(', '), node, {
    module: moduleSpecifier,
    exportedNames,
  });
}

function processFunctionDefinition(
  node: FunctionDeclaration | FunctionExpression | ArrowFunction | MethodDeclaration,
  overrideName?: string,
): SemanticNode {
  const name = overrideName ?? (Node.isArrowFunction(node) ? undefined : node.getName() ?? undefined);
  const params = node.getParameters().map(p => summarizeParamName(p));
  const returnType = node.getReturnType().getText() || 'void';
  const body = node.getBody();

  const children: SemanticNode[] = [];
  if (body) {
    if (Node.isBlock(body)) {
      children.push(...processBlock(body));
    } else {
      const retChildren: SemanticNode[] = [];
      let hasJsx = false;
      const jsxNode = getJsxFromExpression(body);
      if (jsxNode) {
        hasJsx = true;
        const result = processJsxNode(jsxNode);
        if (result) retChildren.push(result);
      } else {
        retChildren.push(...processExpression(body));
      }
      const retType = hasJsx ? 'return-jsx' : retChildren.length > 0 ? 'return-target' : 'return';
      children.push(makeNodeFromAst(retType, undefined, body, {
        value: hasJsx ? null : (retChildren.length > 0 ? null : (body ? truncate(body.getText()) : null)),
        hasJsx,
      }, retChildren));
    }
  }

  const metadata: Record<string, any> = {
    parameters: params,
    returnType,
  };

  if (Node.isFunctionDeclaration(node)) {
    metadata.exported = node.hasExportKeyword();
  }

  return makeNodeFromAst('function-definition', name, node, metadata, children, getIdentifierPos(node, 'function-definition'));
}

function processClass(node: ClassDeclaration): SemanticNode {
  const name = node.getName() || 'anonymous';
  const children: SemanticNode[] = [];

  for (const member of node.getMembers()) {
    if (Node.isMethodDeclaration(member)) {
      children.push(processFunctionDefinition(member));
    } else if (Node.isPropertyDeclaration(member)) {
      children.push(processProperty(member));
    }
  }

  const extendsClause = node.getExtends();
  return makeNodeFromAst('class', name, node, {
    extends: extendsClause ? extendsClause.getExpression().getText() : null,
    exported: node.hasExportKeyword(),
  }, children, getIdentifierPos(node, 'class'));
}



function processProperty(node: PropertyDeclaration): SemanticNode {
  const name = node.getName();
  return makeNodeFromAst('property', name, node, {
    type: (node.getTypeNode()?.getText() ?? node.getType().getText()) || 'any',
    initializer: node.getInitializer()?.getText() || null,
  }, [], getIdentifierPos(node, 'property'));
}

function processInterface(node: InterfaceDeclaration): SemanticNode {
  const name = node.getName();
  const children: SemanticNode[] = [];

  for (const member of node.getMembers()) {
    if (Node.isPropertySignature(member)) {
      children.push(makeNodeFromAst('property', member.getName(), member, {
        type: (member.getTypeNode()?.getText() ?? member.getType().getText()) || 'any',
        optional: member.hasQuestionToken(),
      }, [], getIdentifierPos(member, 'property')));
    }
  }

  return makeNodeFromAst('interface', name, node, {
    exported: node.hasExportKeyword(),
  }, children, getIdentifierPos(node, 'interface'));
}

function processTypeAlias(node: TypeAliasDeclaration): SemanticNode {
  const typeNode = node.getTypeNode();
  // Multi-line type bodies: split the body into one per-line child so the
  // translation mirrors the source row-by-row. Without this, the entire
  // RHS (incl. discriminated unions like `type Action = | {...} | {...}`)
  // gets stuffed onto the LHS row while L_onward go empty -> visual
  // misalignment. Single-line type aliases keep the existing `{type}` blob.
  if (typeNode && typeNode.getEndLineNumber() > typeNode.getStartLineNumber()) {
    const sf = typeNode.getSourceFile();
    const fullText = sf.getFullText();
    const sourceLines = fullText.split('\n');
    const typeStart = typeNode.getStartLineNumber();
    const typeEnd = typeNode.getEndLineNumber();
    const children: SemanticNode[] = [];
    for (let line = typeStart; line <= typeEnd; line++) {
      const raw = sourceLines[line - 1] ?? '';
      const text = truncate(raw);
      if (!text) continue;
      children.push(makeNodeOnLine('type-alias-line', undefined, line, { value: text }));
    }
    return makeNodeFromAst('typeAlias', node.getName(), node, {
      type: '',
      multiline: true,
      exported: node.hasExportKeyword(),
    }, children, getIdentifierPos(node, 'typeAlias'));
  }
  return makeNodeFromAst('typeAlias', node.getName(), node, {
    type: typeNode?.getText() ?? node.getType().getText(),
    exported: node.hasExportKeyword(),
  }, [], getIdentifierPos(node, 'typeAlias'));
}

function processVariableDeclaration(
  decl: VariableDeclaration,
  exported?: boolean,
): SemanticNode[] {
  const name = decl.getName();
  const initializer = decl.getInitializer();
  if (initializer) {
    const unwrapped = unwrapExpression(initializer);
    if (Node.isArrowFunction(unwrapped)) {
      const funcNode = processFunctionDefinition(unwrapped, name);
      if (exported) {
        funcNode.metadata.exported = true;
      }
      return [funcNode];
    }
  }
  const children: SemanticNode[] = [];
  if (initializer) {
    children.push(...processExpression(initializer));
  }
  const hasChildren = children.length > 0;
  const initText = hasChildren ? null : (initializer ? truncate(initializer.getText()) : null);
  const type = hasChildren ? 'variable-assignment-target' : 'variable-assignment';
  return [makeNodeFromAst(type, name, decl, {
    type: (decl.getTypeNode()?.getText() ?? decl.getType().getText()) || 'any',
    initializer: initText,
    exported: exported ?? false,
  }, children, decl.getNameNode().getStart())];
}

function processObjectLiteral(
  expr: import('ts-morph').ObjectLiteralExpression,
): { open: SemanticNode; properties: SemanticNode[]; close: SemanticNode } {
  const openLine = expr.getStartLineNumber();
  const closeLine = expr.getEndLineNumber();
  const properties: SemanticNode[] = [];

  for (const prop of expr.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const propName = prop.getName();
      const valueText = prop.getInitializer()?.getText() ?? '';
      const propLine = prop.getStartLineNumber();
      properties.push(makeNodeOnLine('object-property', propName, propLine, {
        value: truncate(valueText),
      }));
    } else if (Node.isShorthandPropertyAssignment(prop)) {
      const propName = prop.getName();
      const propLine = prop.getStartLineNumber();
      properties.push(makeNodeOnLine('object-property', propName, propLine, {
        value: '',
        shorthand: true,
      }));
    } else if (Node.isSpreadAssignment(prop)) {
      const exprText = prop.getExpression().getText();
      const propLine = prop.getStartLineNumber();
      properties.push(makeNodeOnLine('object-property', `...${truncate(exprText)}`, propLine, {
        value: '',
        isSpread: true,
      }));
    } else if (Node.isMethodDeclaration(prop)) {
      const propName = prop.getName();
      const propLine = prop.getStartLineNumber();
      properties.push(makeNodeOnLine('object-property', propName, propLine, {
        value: '<method>',
        isMethod: true,
      }));
    }
  }

  const open = makeNodeOnLine('object-literal', undefined, openLine, {});
  const close = makeNodeOnLine('object-literal-close', undefined, closeLine, {});

  return { open, properties, close };
}

function processReturn(node: ReturnStatement): SemanticNode {
  const children: SemanticNode[] = [];
  let hasJsx = false;

  const expr = node.getExpression();
  if (expr) {
    const jsxNode = getJsxFromExpression(expr);
    if (jsxNode) {
      hasJsx = true;
      const result = processJsxNode(jsxNode);
      if (result) children.push(result);
    } else {
      children.push(...processExpression(expr));
    }
  }

  const type = hasJsx ? 'return-jsx' : children.length > 0 ? 'return-target' : (expr ? 'return-value' : 'return');
  return makeNodeFromAst(type, undefined, node, {
    value: hasJsx ? null : (children.length > 0 ? null : (expr ? truncate(expr.getText()) : null)),
    hasJsx,
  }, children);
}

function processIf(node: IfStatement): SemanticNode {
  const children: SemanticNode[] = [];
  children.push(...processBody(node.getThenStatement()));
  const elseStatement = node.getElseStatement();
  if (elseStatement) {
    if (Node.isIfStatement(elseStatement)) {
      children.push(processIf(elseStatement));
    } else {
      children.push(...processBody(elseStatement));
    }
  }

  return makeNodeFromAst('if', undefined, node, {
    condition: truncate(node.getExpression().getText()),
    hasElse: !!elseStatement,
  }, children);
}

function processLoop(
  node: ForStatement | ForOfStatement | ForInStatement,
): SemanticNode {
  const statement = node.getStatement();
  const children = processBody(statement);
  const loopType = Node.isForStatement(node) ? 'for' : Node.isForOfStatement(node) ? 'forOf' : 'forIn';
  return makeNodeFromAst('loop', undefined, node, {
    loopType,
    condition: truncate(node.getText().split('{')[0] || ''),
  }, children);
}

function processWhile(node: WhileStatement | DoStatement): SemanticNode {
  const statement = node.getStatement();
  const children = processBody(statement);
  return makeNodeFromAst('loop', undefined, node, {
    loopType: 'while',
    condition: truncate(node.getExpression().getText()),
  }, children);
}

function processCaseBody(
  clause: CaseClause | DefaultClause,
): SemanticNode[] {
  const nodes: SemanticNode[] = [];
  for (const stmt of clause.getStatements()) {
    nodes.push(...processStatement(stmt));
  }
  return nodes;
}

function processSwitch(node: SwitchStatement): SemanticNode {
  const expression = truncate(node.getExpression().getText());
  const clauses = node.getCaseBlock().getClauses();

  if (clauses.length === 0) {
    return makeNodeFromAst('if', undefined, node, {
      condition: expression,
      hasElse: false,
    }, []);
  }

  const first = clauses[0];
  const rest = clauses.slice(1);
  const firstBody = processCaseBody(first);
  const restChain = buildSwitchChain(rest, expression);

  if (Node.isDefaultClause(first)) {
    const children = restChain ? [...firstBody, restChain] : firstBody;
    return makeNodeFromAst('otherwise', undefined, node, {}, children);
  }

  const label = truncate(first.getExpression().getText());
  const condition = `${expression} === ${label}`;
  const children = restChain ? [...firstBody, restChain] : firstBody;
  return makeNodeFromAst('if', undefined, node, {
    condition,
    hasElse: !!restChain,
  }, children);
}

function buildSwitchChain(
  clauses: (CaseClause | DefaultClause)[],
  expression: string,
): SemanticNode | null {
  if (clauses.length === 0) return null;
  const clause = clauses[0];
  const rest = clauses.slice(1);
  const body = processCaseBody(clause);
  const next = buildSwitchChain(rest, expression);
  const children = next ? [...body, next] : body;

  if (Node.isDefaultClause(clause)) {
    return makeNodeFromAst('otherwise', undefined, clause, {}, children);
  }
  const label = truncate(clause.getExpression().getText());
  const condition = `${expression} === ${label}`;
  return makeNodeFromAst('otherwise-if', undefined, clause, {
    condition,
    hasElse: !!next,
  }, children);
}

function processBody(body: Node | undefined): SemanticNode[] {
  if (!body) return [];
  if (Node.isBlock(body)) return processBlock(body);
  return processStatement(body);
}

function processExpressionStatement(node: ExpressionStatement): SemanticNode[] {
  const expr = node.getExpression();
  if (isJsxNode(expr)) {
    const result = processJsxNode(expr);
    return result ? [result] : [];
  }
  return processExpression(expr);
}

function processTernaryExpression(expr: ConditionalExpression): SemanticNode[] {
  const condition = truncate(expr.getCondition().getText());
  const trueExpr = expr.getWhenTrue();
  const falseExpr = expr.getWhenFalse();

  const trueNode = makeNodeFromAst('ternary-value', undefined, trueExpr, {
    value: truncate(trueExpr.getText()),
  });
  const falseNode = makeNodeFromAst('ternary-value', undefined, falseExpr, {
    value: truncate(falseExpr.getText()),
  });

  const conditionNode = makeNodeFromAst('ternary-condition', undefined, expr, {
    condition,
  }, [trueNode]);

  const otherwiseNode = makeNodeFromAst('ternary-otherwise', undefined, expr, {}, [falseNode]);

  return [conditionNode, otherwiseNode];
}

function processExpression(expr: Node): SemanticNode[] {
  const unwrapped = unwrapExpression(expr);
  if (isJsxNode(unwrapped)) {
    const result = processJsxNode(unwrapped);
    return result ? [result] : [];
  }
  if (Node.isAsExpression(unwrapped)) {
    // `x as T` (incl. `as const`): translate the inner expression and append
    // the ` as T` suffix to the literal's trailing close node. Without this
    // branch, `AsExpression` matched nothing below and the whole initializer
    // fell back to a single-line `truncate(initializer.getText())`, which
    // collapsed multi-line object literals (e.g. `actionTypes`) onto one
    // translated row while the source stayed on many → misalignment.
    const inner = unwrapExpression(unwrapped.getExpression()!);
    const typeText = unwrapped.getTypeNode()?.getText();
    const asSuffix = typeText ? ` as ${typeText}` : '';
    const nodes = processExpression(inner);
    const close = nodes.find(n => n.type === 'object-literal-close');
    if (close) {
      close.metadata.asSuffix = (close.metadata.asSuffix ?? '') + asSuffix;
    }
    return nodes;
  }
  if (Node.isCallExpression(unwrapped) || Node.isNewExpression(unwrapped)) {
    return processCallFunction(unwrapped);
  }
  if (Node.isArrowFunction(unwrapped) || Node.isFunctionExpression(unwrapped)) {
    const result = processFunctionDefinition(unwrapped);
    return result ? [result] : [];
  }
  if (Node.isObjectLiteralExpression(unwrapped)) {
    const { open, properties, close } = processObjectLiteral(unwrapped);
    return [open, ...properties, close];
  }
  if (Node.isConditionalExpression(unwrapped)) {
    return processTernaryExpression(unwrapped);
  }
  if (Node.isBinaryExpression(unwrapped)) {
    const op = unwrapped.getOperatorToken().getText();
    if (op === '=') {
      const left = unwrapped.getLeft();
      const right = unwrapped.getRight();
      if (Node.isIdentifier(left)) {
        const name = left.getText();
        const children = processExpression(right);
        const hasChildren = children.length > 0;
        const initText = hasChildren ? null : truncate(right.getText());
        const type = hasChildren ? 'variable-assignment-target' : 'variable-assignment';
        return [makeNodeFromAst(type, name, unwrapped, {
          type: 'any',
          initializer: initText,
        }, children, left.getStart())];
      }
    }
    return [];
  }
  return [];
}

function resolveCallParameterNames(
  callee: Node,
  argCount: number,
): (string | null)[] {
  try {
    const symbol = callee.getSymbol?.();
    if (!symbol) return [];
    const declarations = symbol.getDeclarations();
    if (declarations.length === 0) return [];

    for (const decl of declarations) {
      let params: ParameterDeclaration[] | undefined;

      if (Node.isFunctionDeclaration(decl) || Node.isMethodDeclaration(decl) ||
          Node.isFunctionExpression(decl) || Node.isArrowFunction(decl)) {
        params = decl.getParameters();
      } else if (Node.isVariableDeclaration(decl)) {
        const init = decl.getInitializer();
        if (init && (Node.isFunctionExpression(init) || Node.isArrowFunction(init))) {
          params = init.getParameters();
        }
      }

      if (params) {
        return Array.from({ length: argCount }, (_, i) =>
          i < params.length ? summarizeParamName(params[i]) : null,
        );
      }
    }
  } catch {
    // fallback
  }
  return [];
}

function processCallFunction(
  node: CallExpression | NewExpression,
): SemanticNode[] {
  const isNew = Node.isNewExpression(node);
  const callee = node.getExpression();
  const args = node.getArguments() ?? [];
  const children: SemanticNode[] = [];
  const paramNames = resolveCallParameterNames(callee, args.length);

  args.forEach((arg, i) => {
    const unwrapped = unwrapExpression(arg);
    const paramName = paramNames[i] ?? `param_${i + 1}`;
    if (Node.isIdentifier(unwrapped) || Node.isLiteralExpression(unwrapped)) {
      children.push(makeNodeFromAst('variable-assignment', paramName, arg, {
        initializer: truncate(arg.getText()),
      }));
    } else {
      const argChildren = processExpression(unwrapped);
      const hasChildren = argChildren.length > 0;
      const type = hasChildren ? 'variable-assignment-target' : 'variable-assignment';
      children.push(makeNodeFromAst(type, paramName, arg, {
        initializer: hasChildren ? null : truncate(arg.getText()),
      }, argChildren));
    }
  });

  let chainPrefix: SemanticNode[] = [];
  let functionName: string;

  if (Node.isPropertyAccessExpression(callee)) {
    const objectExpr = callee.getExpression();
    if (Node.isCallExpression(objectExpr) || Node.isNewExpression(objectExpr)) {
      chainPrefix = processCallFunction(objectExpr);
      functionName = truncate('.' + callee.getName(), 100);
    } else {
      functionName = truncate(callee.getText(), 100);
    }
  } else {
    functionName = truncate(callee.getText(), 100);
  }

  const result = makeNodeFromAst('call-function', undefined, node, {
    function: functionName,
    argCount: args.length,
    isNew,
  }, children, getIdentifierPos(node, 'call-function'));

  return [...chainPrefix, result];
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
