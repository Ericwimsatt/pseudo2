/**
 * The dispatcher: maps a TypeScript statement node to the per-kind
 * adapter that knows how to convert it. Centralising the dispatch
 * keeps each per-kind adapter small and focused on a single
 * statement type.
 */

import ts from "typescript";
import type { SemanticNodeId } from "@source-narrator/shared";
import type { SemanticNode } from "@source-narrator/translator-core/semantic/nodes";
import {
  type AdapterContext,
  type AdaptedStatement,
  makeNode,
  rangeOf,
} from "./helpers.js";
import { adaptExpression } from "./expression-adapter.js";
import {
  adaptClassDeclaration,
  adaptEnumDeclaration,
  adaptFunctionDeclaration,
  adaptInterfaceDeclaration,
  adaptTypeAliasDeclaration,
} from "./statements/declarations.js";
import {
  adaptControlFlow,
  adaptForStatement,
  adaptIfStatement,
  adaptReturnStatement,
  adaptSwitchStatement,
  adaptThrowStatement,
  adaptTryStatement,
  adaptWhileStatement,
} from "./statements/control-flow.js";
import { adaptExpressionStatement, adaptVariableStatement } from "./statements/variable.js";
import { adaptExportDeclaration, adaptImportDeclaration } from "./statements/import-export.js";

export const dispatchStatement = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  stmt: ts.Statement,
): AdaptedStatement => {
  if (ts.isVariableStatement(stmt)) return adaptVariableStatement(ctx, parentId, stmt);
  if (ts.isFunctionDeclaration(stmt)) return adaptFunctionDeclaration(ctx, parentId, stmt);
  if (ts.isClassDeclaration(stmt)) return adaptClassDeclaration(ctx, parentId, stmt);
  if (ts.isInterfaceDeclaration(stmt)) return adaptInterfaceDeclaration(ctx, parentId, stmt);
  if (ts.isTypeAliasDeclaration(stmt)) return adaptTypeAliasDeclaration(ctx, parentId, stmt);
  if (ts.isEnumDeclaration(stmt)) return adaptEnumDeclaration(ctx, parentId, stmt);
  if (ts.isImportDeclaration(stmt)) return adaptImportDeclaration(ctx, parentId, stmt);
  if (ts.isExportDeclaration(stmt)) return adaptExportDeclaration(ctx, parentId, stmt);
  if (ts.isExpressionStatement(stmt)) return adaptExpressionStatement(ctx, parentId, stmt);
  if (ts.isIfStatement(stmt)) return adaptIfStatement(ctx, parentId, stmt);
  if (ts.isForStatement(stmt) || ts.isForInStatement(stmt) || ts.isForOfStatement(stmt))
    return adaptForStatement(ctx, parentId, stmt);
  if (ts.isWhileStatement(stmt) || ts.isDoStatement(stmt)) return adaptWhileStatement(ctx, parentId, stmt);
  if (ts.isReturnStatement(stmt)) return adaptReturnStatement(ctx, parentId, stmt);
  if (ts.isThrowStatement(stmt)) return adaptThrowStatement(ctx, parentId, stmt);
  if (ts.isTryStatement(stmt)) return adaptTryStatement(ctx, parentId, stmt);
  if (ts.isSwitchStatement(stmt)) return adaptSwitchStatement(ctx, parentId, stmt);
  if (ts.isBreakStatement(stmt) || ts.isContinueStatement(stmt)) return adaptControlFlow(ctx, parentId, stmt);
  if (ts.isEmptyStatement(stmt)) {
    return {
      nodes: [makeNode(ctx, parentId, "block", null, rangeOf(stmt), "Empty statement.")],
    };
  }
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        "unknown",
        null,
        rangeOf(stmt),
        `Untranslated statement (${ts.SyntaxKind[stmt.kind]}).`,
      ),
    ],
  };
};

/**
 * Adapt the body of a block-shaped construct (function body, loop
 * body, etc.) to a list of semantic nodes. Each statement in the
 * body becomes a child of the enclosing semantic node.
 */
export const adaptBlockBody = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  body: ts.Node,
): SemanticNode[] => {
  if (!body) return [];
  if (ts.isBlock(body)) {
    const out: SemanticNode[] = [];
    for (const s of body.statements) {
      const adapted = dispatchStatement(ctx, parentId, s);
      out.push(...adapted.nodes);
    }
    return out;
  }
  if (ts.isExpression(body)) {
    return adaptExpression(ctx, parentId, body, 0);
  }
  return [];
};
