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
  indent: number;
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
  indent: number,
  metadata: Record<string, any> = {},
): SemanticNode {
  return {
    type,
    name,
    children: [],
    metadata,
    indent,
    sourceStartLine: line,
    sourceEndLine: line,
  };
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
    return [processFunctionDefinition(node, indent)];
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

function processFunctionDefinition(
  node: FunctionDeclaration | FunctionExpression | ArrowFunction | MethodDeclaration,
  indent: number,
  overrideName?: string,
): SemanticNode {
  const name = overrideName ?? (Node.isArrowFunction(node) ? undefined : node.getName() ?? undefined);
  const params = node.getParameters().map(p => summarizeParamName(p));
  const returnType = node.getReturnType().getText() || 'void';
  const body = node.getBody();

  const children: SemanticNode[] = [];
  if (body) {
    if (Node.isBlock(body)) {
      children.push(...processBlock(body, indent + 1));
    } else {
      const retChildren: SemanticNode[] = [];
      let hasJsx = false;
      const jsxNode = getJsxFromExpression(body);
      if (jsxNode) {
        hasJsx = true;
        const result = processJsxNode(jsxNode, indent + 2);
        if (result) retChildren.push(result);
      }
      children.push(makeNodeFromAst('return', undefined, body, indent + 1, {
        value: hasJsx ? null : (body ? truncate(body.getText()) : null),
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

  return makeNodeFromAst('function-definition', name, node, indent, metadata, children, getIdentifierPos(node, 'function-definition'));
}

function processClass(node: ClassDeclaration, indent: number): SemanticNode {
  const name = node.getName() || 'anonymous';
  const children: SemanticNode[] = [];

  for (const member of node.getMembers()) {
    if (Node.isMethodDeclaration(member)) {
      children.push(processFunctionDefinition(member, indent + 1));
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
  const children: SemanticNode[] = [];
  if (initializer) {
    const unwrapped = unwrapExpression(initializer);
    if (Node.isArrowFunction(unwrapped)) {
      children.push(processFunctionDefinition(unwrapped, indent + 1, name));
    } else {
      children.push(...processExpression(initializer, indent + 1));
    }
  }
  const initText = children.length > 0 ? null : (initializer ? truncate(initializer.getText()) : null);
  return [makeNodeFromAst('variable-assignment', name, decl, indent, {
    type: (decl.getTypeNode()?.getText() ?? decl.getType().getText()) || 'any',
    initializer: initText,
    exported: exported ?? false,
  }, children, decl.getNameNode().getStart())];
}

function processObjectLiteral(
  expr: import('ts-morph').ObjectLiteralExpression,
  indent: number,
): { open: SemanticNode; properties: SemanticNode[]; close: SemanticNode } {
  const openLine = expr.getStartLineNumber();
  const closeLine = expr.getEndLineNumber();
  const properties: SemanticNode[] = [];

  for (const prop of expr.getProperties()) {
    if (Node.isPropertyAssignment(prop)) {
      const propName = prop.getName();
      const valueText = prop.getInitializer()?.getText() ?? '';
      const propLine = prop.getStartLineNumber();
      properties.push(makeNodeOnLine('object-property', propName, propLine, indent + 1, {
        value: truncate(valueText),
      }));
    } else if (Node.isShorthandPropertyAssignment(prop)) {
      const propName = prop.getName();
      const propLine = prop.getStartLineNumber();
      properties.push(makeNodeOnLine('object-property', propName, propLine, indent + 1, {
        value: '',
        shorthand: true,
      }));
    } else if (Node.isSpreadAssignment(prop)) {
      const exprText = prop.getExpression().getText();
      const propLine = prop.getStartLineNumber();
      properties.push(makeNodeOnLine('object-property', `...${truncate(exprText)}`, propLine, indent + 1, {
        value: '',
        isSpread: true,
      }));
    } else if (Node.isMethodDeclaration(prop)) {
      const propName = prop.getName();
      const propLine = prop.getStartLineNumber();
      properties.push(makeNodeOnLine('object-property', propName, propLine, indent + 1, {
        value: '<method>',
        isMethod: true,
      }));
    }
  }

  const open = makeNodeOnLine('object-literal', undefined, openLine, indent, {});
  const close = makeNodeOnLine('object-literal-close', undefined, closeLine, indent, {});

  return { open, properties, close };
}

function processReturn(node: ReturnStatement, indent: number): SemanticNode {
  const children: SemanticNode[] = [];
  let hasJsx = false;

  const expr = node.getExpression();
  if (expr) {
    const jsxNode = getJsxFromExpression(expr);
    if (jsxNode) {
      hasJsx = true;
      const result = processJsxNode(jsxNode, indent + 1);
      if (result) children.push(result);
    } else {
      children.push(...processExpression(expr, indent + 1));
    }
  }

  return makeNodeFromAst('return', undefined, node, indent, {
    value: hasJsx ? null : (children.length > 0 ? null : (expr ? truncate(expr.getText()) : null)),
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
  return processExpression(expr, indent);
}

function processTernaryExpression(expr: ConditionalExpression, indent: number): SemanticNode[] {
  const condition = truncate(expr.getCondition().getText());
  const trueExpr = expr.getWhenTrue();
  const falseExpr = expr.getWhenFalse();

  const trueNode = makeNodeFromAst('ternary-value', undefined, trueExpr, indent + 1, {
    value: truncate(trueExpr.getText()),
  });
  const falseNode = makeNodeFromAst('ternary-value', undefined, falseExpr, indent + 1, {
    value: truncate(falseExpr.getText()),
  });

  const conditionNode = makeNodeFromAst('ternary-condition', undefined, expr, indent, {
    condition,
  }, [trueNode]);

  const otherwiseNode = makeNodeFromAst('ternary-otherwise', undefined, expr, indent, {}, [falseNode]);

  return [conditionNode, otherwiseNode];
}

function processExpression(expr: Node, indent: number): SemanticNode[] {
  const unwrapped = unwrapExpression(expr);
  if (isJsxNode(unwrapped)) {
    const result = processJsxNode(unwrapped, indent);
    return result ? [result] : [];
  }
  if (Node.isCallExpression(unwrapped) || Node.isNewExpression(unwrapped)) {
    return processCallFunction(unwrapped, indent);
  }
  if (Node.isArrowFunction(unwrapped) || Node.isFunctionExpression(unwrapped)) {
    const result = processFunctionDefinition(unwrapped, indent);
    return result ? [result] : [];
  }
  if (Node.isObjectLiteralExpression(unwrapped)) {
    const { open, properties, close } = processObjectLiteral(unwrapped, indent);
    return [open, ...properties, close];
  }
  if (Node.isConditionalExpression(unwrapped)) {
    return processTernaryExpression(unwrapped, indent);
  }
  if (Node.isBinaryExpression(unwrapped)) {
    const op = unwrapped.getOperatorToken().getText();
    if (op === '=') {
      const left = unwrapped.getLeft();
      const right = unwrapped.getRight();
      if (Node.isIdentifier(left)) {
        const name = left.getText();
        const children = processExpression(right, indent + 1);
        const initText = children.length > 0 ? null : truncate(right.getText());
        return [makeNodeFromAst('variable-assignment', name, unwrapped, indent, {
          type: 'any',
          initializer: initText,
        }, children, left.getStart())];
      }
    }
    return [];
  }
  return [];
}

function processCallFunction(
  node: CallExpression | NewExpression,
  indent: number,
): SemanticNode[] {
  const isNew = Node.isNewExpression(node);
  const callee = node.getExpression();
  const args = node.getArguments() ?? [];
  const children: SemanticNode[] = [];

  args.forEach((arg, i) => {
    const unwrapped = unwrapExpression(arg);
    const paramName = `param_${i + 1}`;
    if (Node.isIdentifier(unwrapped) || Node.isLiteralExpression(unwrapped)) {
      children.push(makeNodeFromAst('variable-assignment', paramName, arg, indent + 1, {
        initializer: truncate(arg.getText()),
      }));
    } else {
      const argChildren = processExpression(unwrapped, indent + 2);
      children.push(makeNodeFromAst('variable-assignment', paramName, arg, indent + 1, {
        initializer: argChildren.length === 0 ? truncate(arg.getText()) : null,
      }, argChildren));
    }
  });

  let chainPrefix: SemanticNode[] = [];
  let functionName: string;

  if (Node.isPropertyAccessExpression(callee)) {
    const objectExpr = callee.getExpression();
    if (Node.isCallExpression(objectExpr) || Node.isNewExpression(objectExpr)) {
      chainPrefix = processCallFunction(objectExpr, indent);
      functionName = truncate('.' + callee.getName(), 100);
    } else {
      functionName = truncate(callee.getText(), 100);
    }
  } else {
    functionName = truncate(callee.getText(), 100);
  }

  const result = makeNodeFromAst('call-function', undefined, node, indent, {
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
