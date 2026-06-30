import * as ts from 'typescript';

export interface PseudoLine {
  lineNumber: number;
  original: string;
  pseudo: string;
}

/**
 * Translates TypeScript source text into an array of plain-English
 * "pseudo" descriptions, one per statement / declaration.
 *
 * Uses the TS compiler API to walk the AST.
 * @see https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API
 */
export class PseudoTranslator {
  translate(source: string): PseudoLine[] {
    const sourceFile = ts.createSourceFile(
      '__pseudo__.ts',
      source,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true
    );

    const result: PseudoLine[] = [];
    this.walk(sourceFile, sourceFile, source, result);
    return result;
  }

  private walk(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    source: string,
    result: PseudoLine[]
  ) {
    if (ts.isSourceFile(node)) {
      ts.forEachChild(node, (child) =>
        this.walk(child, sourceFile, source, result)
      );
      return;
    }

    const pos = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
    const line = pos.line + 1;
    const original = this.nodeText(node, source);
    const pseudo = this.describe(node, source);

    if (pseudo) {
      result.push({ lineNumber: line, original, pseudo });
    }

    ts.forEachChild(node, (child) =>
      this.walk(child, sourceFile, source, result)
    );
  }

  private nodeText(node: ts.Node, source: string): string {
    return source.slice(node.getStart(), node.getEnd()).trim();
  }

  private describe(node: ts.Node, source: string): string | null {
    if (ts.isImportDeclaration(node)) {
      return this.describeImport(node, source);
    }
    if (ts.isExportDeclaration(node)) {
      return this.describeExport(node, source);
    }
    if (ts.isExportAssignment(node)) {
      return 'exports the module default';
    }
    if (ts.isVariableStatement(node)) {
      return this.describeVariableStatement(node);
    }
    if (ts.isFunctionDeclaration(node)) {
      return this.describeFunction(node);
    }
    if (ts.isClassDeclaration(node)) {
      return this.describeClass(node);
    }
    if (ts.isInterfaceDeclaration(node)) {
      return this.describeInterface(node);
    }
    if (ts.isTypeAliasDeclaration(node)) {
      return this.describeTypeAlias(node);
    }
    if (ts.isEnumDeclaration(node)) {
      return this.describeEnum(node);
    }
    if (ts.isIfStatement(node)) {
      return this.describeIf(node, source);
    }
    if (ts.isForStatement(node)) {
      return 'a for loop';
    }
    if (ts.isForInStatement(node)) {
      return 'a for...in loop';
    }
    if (ts.isForOfStatement(node)) {
      return 'a for...of loop';
    }
    if (ts.isWhileStatement(node)) {
      return 'a while loop';
    }
    if (ts.isDoStatement(node)) {
      return 'a do...while loop';
    }
    if (ts.isSwitchStatement(node)) {
      return 'a switch statement';
    }
    if (ts.isTryStatement(node)) {
      return 'a try...catch block';
    }
    if (ts.isThrowStatement(node)) {
      return 'throws an error';
    }
    if (ts.isReturnStatement(node)) {
      if (node.expression) {
        return `returns ${source.slice(node.expression.getStart(), node.expression.getEnd()).trim()}`;
      }
      return 'returns';
    }
    if (ts.isCallExpression(node) || ts.isExpressionStatement(node)) {
      return null;
    }
    if (ts.isModuleDeclaration(node)) {
      return `defines a namespace "${
        ts.isIdentifier(node.name) ? node.name.text : 'module'
      }"`;
    }
    return null;
  }

  private describeImport(node: ts.ImportDeclaration, source: string): string {
    const clause = node.importClause;
    const moduleSpec = node.moduleSpecifier;
    const fromText = ts.isStringLiteral(moduleSpec) ? moduleSpec.text : '?';

    if (!clause) {
      return `imports "${fromText}" (side-effect only)`;
    }

    const parts: string[] = [];

    if (clause.isTypeOnly) {
      parts.push('imports type(s)');
    } else {
      parts.push('imports');
    }

    const name = clause.name?.text;
    const bindings = clause.namedBindings;

    if (bindings) {
      if (ts.isNamedImports(bindings)) {
        const names = bindings.elements.map((e) => e.name.text).join(', ');
        parts.push(`{ ${names} }`);
      } else if (ts.isNamespaceImport(bindings)) {
        parts.push(`* as ${bindings.name.text}`);
      }
    }

    if (name) {
      parts.push(name);
    }

    parts.push(`from "${fromText}"`);
    return parts.join(' ');
  }

  private describeExport(node: ts.ExportDeclaration, source: string): string {
    if (!node.exportClause && !node.moduleSpecifier) {
      return 're-exports all';
    }

    const parts: string[] = ['exports'];

    if (node.isTypeOnly) {
      parts[0] = 'exports type(s)';
    }

    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      const names = node.exportClause.elements
        .map((e) => e.name.text)
        .join(', ');
      parts.push(`{ ${names} }`);
    }

    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      parts.push(`from "${node.moduleSpecifier.text}"`);
    }

    return parts.join(' ');
  }

  private describeVariableStatement(node: ts.VariableStatement): string {
    const decl = node.declarationList.declarations[0];
    if (!decl) return 'declares a variable';

    const name = ts.isIdentifier(decl.name) ? decl.name.text : '?';
    const kind = this.varKind(node.declarationList.flags);
    const type = decl.type ? ` with type '${decl.type.getText()}'` : '';
    const init = decl.initializer ? ` set to ${decl.initializer.getText()}` : '';

    return `declares a ${kind} variable named '${name}'${type}${init}`;
  }

  private describeFunction(node: ts.FunctionDeclaration): string | null {
    const name = node.name?.text ?? 'anonymous';
    const params = node.parameters
      .map((p) => `${p.name.getText()}${p.type ? ': ' + p.type.getText() : ''}`)
      .join(', ');

    const returnType = node.type ? ` and returns ${node.type.getText()}` : '';

    let prefix = 'defines';
    if (node.modifiers) {
      for (const mod of node.modifiers) {
        if (mod.kind === ts.SyntaxKind.ExportKeyword) {
          prefix = 'exports a function named';
        } else if (mod.kind === ts.SyntaxKind.DefaultKeyword) {
          prefix = 'exports (default) a function named';
        } else if (mod.kind === ts.SyntaxKind.AsyncKeyword) {
          prefix = 'defines an async function named';
        }
      }
    }

    return `${prefix} '${name}' that takes (${params})${returnType}`;
  }

  private describeClass(node: ts.ClassDeclaration): string {
    const name = node.name?.text ?? 'anonymous';
    const heritage = node.heritageClauses
      ?.map((h) => {
        const types = h.types.map((t) => t.expression.getText()).join(', ');
        return h.token === ts.SyntaxKind.ExtendsKeyword
          ? ` extends ${types}`
          : ` implements ${types}`;
      })
      .join('') ?? '';

    return `defines a class named '${name}'${heritage}`;
  }

  private describeInterface(node: ts.InterfaceDeclaration): string {
    const name = node.name.text;
    const heritage = node.heritageClauses
      ?.map((h) => {
        return ' extends ' + h.types.map((t) => t.expression.getText()).join(', ');
      })
      .join('') ?? '';

    return `defines an interface named '${name}'${heritage}`;
  }

  private describeTypeAlias(node: ts.TypeAliasDeclaration): string {
    return `creates a type alias '${node.name.text}' for ${node.type.getText()}`;
  }

  private describeEnum(node: ts.EnumDeclaration): string {
    const members = node.members
      .map((m) => m.name.getText())
      .join(', ');
    return `defines an enum '${node.name.text}' with members: ${members}`;
  }

  private describeIf(node: ts.IfStatement, source: string): string {
    const condition = source.slice(
      node.expression.getStart(),
      node.expression.getEnd()
    );
    if (node.elseStatement) {
      return `if (${condition}) ... else ...`;
    }
    return `if (${condition}) ...`;
  }

  private varKind(flags: ts.NodeFlags): string {
    if (flags & ts.NodeFlags.Const) return 'constant';
    if (flags & ts.NodeFlags.Let) return 'mutable';
    return 'variable';
  }
}
