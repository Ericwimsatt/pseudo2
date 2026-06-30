import * as ts from 'typescript';

export interface SemanticNode {
  type: string;
  name?: string;
  children: SemanticNode[];
  metadata: Record<string, any>;
  indent: number;
}

export function makeSemanticGraph(sourceFile: ts.SourceFile): SemanticNode[] {
  const nodes: SemanticNode[] = [];

  function visit(node: ts.Node, indent: number = 0) {
    if (ts.isImportDeclaration(node)) {
      nodes.push(processImport(node, indent));
    } else if (ts.isExportDeclaration(node)) {
      nodes.push(processExport(node, indent));
    } else if (ts.isFunctionDeclaration(node)) {
      nodes.push(processFunction(node, indent));
    } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent)) {
        nodes.push(processFunctionVariable(parent, node, indent));
      }
    } else if (ts.isClassDeclaration(node)) {
      nodes.push(processClass(node, indent));
    } else if (ts.isInterfaceDeclaration(node)) {
      nodes.push(processInterface(node, indent));
    } else if (ts.isTypeAliasDeclaration(node)) {
      nodes.push(processTypeAlias(node, indent));
    } else if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(decl => {
        if (!ts.isArrowFunction(decl.initializer) && !ts.isFunctionExpression(decl.initializer)) {
          nodes.push(processVariable(decl, indent));
        }
      });
    } else if (ts.isReturnStatement(node)) {
      nodes.push(processReturn(node, indent));
    } else if (ts.isIfStatement(node)) {
      nodes.push(processIf(node, indent));
    } else if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) {
      nodes.push(processLoop(node, indent));
    } else if (ts.isCallExpression(node)) {
      nodes.push(processCallExpression(node, indent));
    }

    ts.forEachChild(node, child => visit(child, indent));
  }

  visit(sourceFile);
  return nodes;
}

function processImport(node: ts.ImportDeclaration, indent: number): SemanticNode {
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

  return {
    type: 'import',
    name: importedNames.join(', '),
    children: [],
    metadata: {
      module: moduleSpecifier.replace(/['"]/g, ''),
      importedNames
    },
    indent
  };
}

function processExport(node: ts.ExportDeclaration, indent: number): SemanticNode {
  const moduleSpecifier = node.moduleSpecifier?.getText().replace(/['"]/g, '') || '';
  const exportClause = node.exportClause;
  let exportedNames: string[] = [];

  if (exportClause && ts.isNamedExports(exportClause)) {
    exportClause.elements.forEach(el => {
      exportedNames.push(el.name.text);
    });
  }

  return {
    type: 'export',
    name: exportedNames.join(', '),
    children: [],
    metadata: {
      module: moduleSpecifier,
      exportedNames
    },
    indent
  };
}

function processFunction(node: ts.FunctionDeclaration, indent: number): SemanticNode {
  const name = node.name?.text || 'anonymous';
  const params = node.parameters.map(p => p.name.getText());
  const children: SemanticNode[] = [];

  if (node.body) {
    node.body.statements.forEach(stmt => {
      const childNodes = processStatement(stmt, indent + 1);
      children.push(...childNodes);
    });
  }

  return {
    type: 'function',
    name,
    children,
    metadata: {
      parameters: params,
      returnType: node.type?.getText() || 'void'
    },
    indent
  };
}

function processFunctionVariable(
  decl: ts.VariableDeclaration,
  func: ts.ArrowFunction | ts.FunctionExpression,
  indent: number
): SemanticNode {
  const name = decl.name.getText();
  const params = func.parameters.map(p => p.name.getText());
  const children: SemanticNode[] = [];

  if (func.body) {
    if (ts.isBlock(func.body)) {
      func.body.statements.forEach(stmt => {
        const childNodes = processStatement(stmt, indent + 1);
        children.push(...childNodes);
      });
    }
  }

  return {
    type: 'function',
    name,
    children,
    metadata: {
      parameters: params,
      returnType: func.type?.getText() || 'void'
    },
    indent
  };
}

function processClass(node: ts.ClassDeclaration, indent: number): SemanticNode {
  const name = node.name?.text || 'anonymous';
  const children: SemanticNode[] = [];

  node.members.forEach(member => {
    if (ts.isMethodDeclaration(member)) {
      children.push(processMethod(member, indent + 1));
    } else if (ts.isPropertyDeclaration(member)) {
      children.push(processProperty(member, indent + 1));
    }
  });

  return {
    type: 'class',
    name,
    children,
    metadata: {
      extends: node.heritageClauses?.[0]?.types[0]?.expression.getText() || null
    },
    indent
  };
}

function processMethod(node: ts.MethodDeclaration, indent: number): SemanticNode {
  const name = node.name.getText();
  const params = node.parameters.map(p => p.name.getText());
  const children: SemanticNode[] = [];

  if (node.body) {
    node.body.statements.forEach(stmt => {
      const childNodes = processStatement(stmt, indent + 1);
      children.push(...childNodes);
    });
  }

  return {
    type: 'method',
    name,
    children,
    metadata: {
      parameters: params,
      returnType: node.type?.getText() || 'void'
    },
    indent
  };
}

function processProperty(node: ts.PropertyDeclaration, indent: number): SemanticNode {
  const name = node.name.getText();
  return {
    type: 'property',
    name,
    children: [],
    metadata: {
      type: node.type?.getText() || 'any',
      initializer: node.initializer?.getText() || null
    },
    indent
  };
}

function processInterface(node: ts.InterfaceDeclaration, indent: number): SemanticNode {
  const name = node.name.text;
  const children: SemanticNode[] = [];

  node.members.forEach(member => {
    if (ts.isPropertySignature(member)) {
      children.push({
        type: 'property',
        name: member.name.getText(),
        children: [],
        metadata: {
          type: member.type?.getText() || 'any'
        },
        indent: indent + 1
      });
    }
  });

  return {
    type: 'interface',
    name,
    children,
    metadata: {},
    indent
  };
}

function processTypeAlias(node: ts.TypeAliasDeclaration, indent: number): SemanticNode {
  return {
    type: 'typeAlias',
    name: node.name.text,
    children: [],
    metadata: {
      type: node.type.getText()
    },
    indent
  };
}

function processVariable(node: ts.VariableDeclaration, indent: number): SemanticNode {
  return {
    type: 'variable',
    name: node.name.getText(),
    children: [],
    metadata: {
      type: node.type?.getText() || 'any',
      initializer: node.initializer?.getText() || null
    },
    indent
  };
}

function processReturn(node: ts.ReturnStatement, indent: number): SemanticNode {
  return {
    type: 'return',
    children: [],
    metadata: {
      value: node.expression?.getText() || null
    },
    indent
  };
}

function processIf(node: ts.IfStatement, indent: number): SemanticNode {
  const children: SemanticNode[] = [];

  if (ts.isBlock(node.thenStatement)) {
    node.thenStatement.statements.forEach(stmt => {
      children.push(...processStatement(stmt, indent + 1));
    });
  }

  return {
    type: 'if',
    children,
    metadata: {
      condition: node.expression.getText()
    },
    indent
  };
}

function processLoop(node: ts.ForStatement | ts.ForOfStatement | ts.ForInStatement, indent: number): SemanticNode {
  const children: SemanticNode[] = [];
  const statement = ts.isForStatement(node) ? node.statement : node.statement;

  if (ts.isBlock(statement)) {
    statement.statements.forEach(stmt => {
      children.push(...processStatement(stmt, indent + 1));
    });
  }

  return {
    type: 'loop',
    children,
    metadata: {
      loopType: ts.isForStatement(node) ? 'for' : ts.isForOfStatement(node) ? 'forOf' : 'forIn'
    },
    indent
  };
}

function processCallExpression(node: ts.CallExpression, indent: number): SemanticNode {
  return {
    type: 'call',
    children: [],
    metadata: {
      function: node.expression.getText(),
      arguments: node.arguments.map(arg => arg.getText())
    },
    indent
  };
}

function processStatement(node: ts.Node, indent: number): SemanticNode[] {
  const nodes: SemanticNode[] = [];

  if (ts.isReturnStatement(node)) {
    nodes.push(processReturn(node, indent));
  } else if (ts.isIfStatement(node)) {
    nodes.push(processIf(node, indent));
  } else if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) {
    nodes.push(processLoop(node, indent));
  } else if (ts.isVariableStatement(node)) {
    node.declarationList.declarations.forEach(decl => {
      nodes.push(processVariable(decl, indent));
    });
  } else if (ts.isExpressionStatement(node)) {
    if (ts.isCallExpression(node.expression)) {
      nodes.push(processCallExpression(node.expression, indent));
    }
  }

  return nodes;
}
