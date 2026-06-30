/**
 * Adapts import and export declarations to semantic nodes.
 */

import ts from "typescript";
import type { SemanticNodeId } from "@source-narrator/shared";
import type { SemanticNode } from "@source-narrator/translator-core/semantic/nodes";
import {
  type AdapterContext,
  type AdaptedStatement,
  identifierName,
  makeNode,
  rangeOf,
} from "../helpers.js";

export const adaptImportDeclaration = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  decl: ts.ImportDeclaration,
): AdaptedStatement => {
  const module = ts.isStringLiteral(decl.moduleSpecifier) ? decl.moduleSpecifier.text : "<dynamic>";
  const clause = decl.importClause;
  const defaultName = clause && clause.name ? clause.name.text : null;
  const named: string[] = [];
  if (clause && clause.namedBindings) {
    if (ts.isNamedImports(clause.namedBindings)) {
      for (const s of clause.namedBindings.elements) named.push(identifierName(s.name) ?? "?");
    } else if (ts.isNamespaceImport(clause.namedBindings)) {
      named.push(`* as ${clause.namedBindings.name.text}`);
    }
  }
  const text = defaultName
    ? `Import default ${defaultName} from "${module}".`
    : named.length > 0
      ? `Import { ${named.join(", ")} } from "${module}".`
      : `Import side effects from "${module}".`;
  return {
    nodes: [
      makeNode(ctx, parentId, "import", module, rangeOf(decl), text, { module, defaultName, named }),
    ],
  };
};

export const adaptExportDeclaration = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  decl: ts.ExportDeclaration,
): AdaptedStatement => {
  const text =
    decl.moduleSpecifier && ts.isStringLiteral(decl.moduleSpecifier)
      ? `Re-export from "${decl.moduleSpecifier.text}".`
      : "Re-export named bindings.";
  return {
    nodes: [makeNode(ctx, parentId, "export", null, rangeOf(decl), text)],
  };
};
