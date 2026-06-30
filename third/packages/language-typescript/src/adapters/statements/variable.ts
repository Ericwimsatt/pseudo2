/**
 * Adapts variable declarations, expression statements, and other
 * "small" statements.
 */

import ts from "typescript";
import type { SemanticNodeId } from "@source-narrator/shared";
import type { SemanticNode } from "@source-narrator/translator-core/semantic/nodes";
import {
  type AdapterContext,
  type AdaptedStatement,
  bindingName,
  makeNode,
  rangeOf,
  textOf,
} from "../helpers.js";
import { adaptExpression } from "../expression-adapter.js";

export const adaptVariableStatement = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  stmt: ts.VariableStatement,
): AdaptedStatement => {
  const nodes: SemanticNode[] = stmt.declarationList.declarations.map((decl) => {
    const name = bindingName(decl.name);
    const init = decl.initializer ? adaptExpression(ctx, parentId, decl.initializer, 0) : [];
    return makeNode(
      ctx,
      parentId,
      decl.initializer ? "assignment" : "variable",
      name,
      rangeOf(decl),
      decl.initializer ? `Declare ${name ?? "variable"} and assign a value.` : `Declare ${name ?? "variable"}.`,
      { declarationKind: "variable" },
      init,
    );
  });
  return { nodes };
};

export const adaptExpressionStatement = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  stmt: ts.ExpressionStatement,
): AdaptedStatement => {
  const exprs = adaptExpression(ctx, parentId, stmt.expression, 0);
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        exprs[0]?.kind ?? "expression",
        exprs[0]?.name ?? null,
        rangeOf(stmt),
        exprs[0]?.text ?? textOf(stmt),
      ),
    ],
  };
};
