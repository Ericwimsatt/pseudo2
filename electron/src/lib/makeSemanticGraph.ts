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

export function makeSemanticGraph(sourceFile: ts.SourceFile): SemanticNode[] {
  const nodes: SemanticNode[] = [];

  function isJsxInsideReturn(node: ts.Node): boolean {
    let parent = node.parent;
    while (parent) {
      if (ts.isReturnStatement(parent)) return true;
      if (ts.isFunctionDeclaration(parent) || ts.isArrowFunction(parent) || ts.isFunctionExpression(parent) || ts.isMethodDeclaration(parent)) break;
      parent = parent.parent;
    }
    return false;
  }

  function visit(node: ts.Node, indent: number = 0) {
    if (isJsxNode(node)) {
      if (!isJsxInsideReturn(node)) {
        const result = processJsxNode(node, indent, sourceFile);
        if (result) nodes.push(result);
      }
      return;
    }

    if (ts.isImportDeclaration(node)) {
      nodes.push(processImport(node, indent, sourceFile));
    } else if (ts.isExportDeclaration(node)) {
      nodes.push(processExport(node, indent, sourceFile));
    } else if (ts.isFunctionDeclaration(node)) {
      nodes.push(processFunction(node, indent, sourceFile));
    } else if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent)) {
        nodes.push(processFunctionVariable(parent, node, indent, sourceFile));
      }
    } else if (ts.isClassDeclaration(node)) {
      nodes.push(processClass(node, indent, sourceFile));
    } else if (ts.isInterfaceDeclaration(node)) {
      nodes.push(processInterface(node, indent, sourceFile));
    } else if (ts.isTypeAliasDeclaration(node)) {
      nodes.push(processTypeAlias(node, indent, sourceFile));
    } else if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(decl => {
        if (!ts.isArrowFunction(decl.initializer) && !ts.isFunctionExpression(decl.initializer)) {
          nodes.push(processVariable(decl, indent, sourceFile));
        }
      });
    } else if (ts.isReturnStatement(node)) {
      nodes.push(processReturn(node, indent, sourceFile));
    } else if (ts.isIfStatement(node)) {
      nodes.push(processIf(node, indent, sourceFile));
    } else if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) {
      nodes.push(processLoop(node, indent, sourceFile));
    } else if (ts.isCallExpression(node)) {
      nodes.push(processCallExpression(node, indent, sourceFile));
    }

    ts.forEachChild(node, child => visit(child, indent));
  }

  visit(sourceFile);
  return nodes;
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
  return {
    type: 'import',
    name: importedNames.join(', '),
    children: [],
    metadata: {
      module: moduleSpecifier.replace(/['"]/g, ''),
      importedNames
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
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
  return {
    type: 'export',
    name: exportedNames.join(', '),
    children: [],
    metadata: {
      module: moduleSpecifier,
      exportedNames
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
}

function processFunction(node: ts.FunctionDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const name = node.name?.text || 'anonymous';
  const params = node.parameters.map(p => p.name.getText());
  const children: SemanticNode[] = [];

  if (node.body) {
    node.body.statements.forEach(stmt => {
      const childNodes = processStatement(stmt, indent + 1, sourceFile);
      children.push(...childNodes);
    });
  }

  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'function',
    name,
    children,
    metadata: {
      parameters: params,
      returnType: node.type?.getText() || 'void'
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
}

function processFunctionVariable(
  decl: ts.VariableDeclaration,
  func: ts.ArrowFunction | ts.FunctionExpression,
  indent: number,
  sourceFile: ts.SourceFile
): SemanticNode {
  const name = decl.name.getText();
  const params = func.parameters.map(p => p.name.getText());
  const children: SemanticNode[] = [];

  if (func.body) {
    if (ts.isBlock(func.body)) {
      func.body.statements.forEach(stmt => {
        const childNodes = processStatement(stmt, indent + 1, sourceFile);
        children.push(...childNodes);
      });
    }
  }

  const lines = getNodeLineRange(decl, sourceFile);
  return {
    type: 'function',
    name,
    children,
    metadata: {
      parameters: params,
      returnType: func.type?.getText() || 'void'
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
}

function processClass(node: ts.ClassDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const name = node.name?.text || 'anonymous';
  const children: SemanticNode[] = [];

  node.members.forEach(member => {
    if (ts.isMethodDeclaration(member)) {
      children.push(processMethod(member, indent + 1, sourceFile));
    } else if (ts.isPropertyDeclaration(member)) {
      children.push(processProperty(member, indent + 1, sourceFile));
    }
  });

  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'class',
    name,
    children,
    metadata: {
      extends: node.heritageClauses?.[0]?.types[0]?.expression.getText() || null
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
}

function processMethod(node: ts.MethodDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const name = node.name.getText();
  const params = node.parameters.map(p => p.name.getText());
  const children: SemanticNode[] = [];

  if (node.body) {
    node.body.statements.forEach(stmt => {
      const childNodes = processStatement(stmt, indent + 1, sourceFile);
      children.push(...childNodes);
    });
  }

  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'method',
    name,
    children,
    metadata: {
      parameters: params,
      returnType: node.type?.getText() || 'void'
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
}

function processProperty(node: ts.PropertyDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const name = node.name.getText();
  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'property',
    name,
    children: [],
    metadata: {
      type: node.type?.getText() || 'any',
      initializer: node.initializer?.getText() || null
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
}

function processInterface(node: ts.InterfaceDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const name = node.name.text;
  const children: SemanticNode[] = [];

  node.members.forEach(member => {
    if (ts.isPropertySignature(member)) {
      const childLines = getNodeLineRange(member, sourceFile);
      children.push({
        type: 'property',
        name: member.name.getText(),
        children: [],
        metadata: {
          type: member.type?.getText() || 'any'
        },
        indent: indent + 1,
        sourceStartLine: childLines.start,
        sourceEndLine: childLines.end
      });
    }
  });

  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'interface',
    name,
    children,
    metadata: {},
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
}

function processTypeAlias(node: ts.TypeAliasDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'typeAlias',
    name: node.name.text,
    children: [],
    metadata: {
      type: node.type.getText()
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
}

function processVariable(node: ts.VariableDeclaration, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'variable',
    name: node.name.getText(),
    children: [],
    metadata: {
      type: node.type?.getText() || 'any',
      initializer: node.initializer?.getText() || null
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
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
  return {
    type: 'return',
    children,
    metadata: {
      value: hasJsx ? null : (node.expression?.getText() || null),
      hasJsx
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
}

function processIf(node: ts.IfStatement, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const children: SemanticNode[] = [];

  if (ts.isBlock(node.thenStatement)) {
    node.thenStatement.statements.forEach(stmt => {
      children.push(...processStatement(stmt, indent + 1, sourceFile));
    });
  }

  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'if',
    children,
    metadata: {
      condition: node.expression.getText()
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
}

function processLoop(node: ts.ForStatement | ts.ForOfStatement | ts.ForInStatement, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const children: SemanticNode[] = [];
  const statement = ts.isForStatement(node) ? node.statement : node.statement;

  if (ts.isBlock(statement)) {
    statement.statements.forEach(stmt => {
      children.push(...processStatement(stmt, indent + 1, sourceFile));
    });
  }

  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'loop',
    children,
    metadata: {
      loopType: ts.isForStatement(node) ? 'for' : ts.isForOfStatement(node) ? 'forOf' : 'forIn'
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
}

function processCallExpression(node: ts.CallExpression, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'call',
    children: [],
    metadata: {
      function: node.expression.getText(),
      arguments: node.arguments.map(arg => arg.getText())
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end
  };
}

function processStatement(node: ts.Node, indent: number, sourceFile: ts.SourceFile): SemanticNode[] {
  const nodes: SemanticNode[] = [];

  if (ts.isReturnStatement(node)) {
    nodes.push(processReturn(node, indent, sourceFile));
  } else if (ts.isIfStatement(node)) {
    nodes.push(processIf(node, indent, sourceFile));
  } else if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node)) {
    nodes.push(processLoop(node, indent, sourceFile));
  } else if (ts.isVariableStatement(node)) {
    node.declarationList.declarations.forEach(decl => {
      nodes.push(processVariable(decl, indent, sourceFile));
    });
  } else if (ts.isExpressionStatement(node)) {
    if (ts.isCallExpression(node.expression)) {
      nodes.push(processCallExpression(node.expression, indent, sourceFile));
    }
  }

  return nodes;
}
