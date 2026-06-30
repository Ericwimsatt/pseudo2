/**
 * Adapts a TypeScript expression to one or more semantic nodes.
 *
 * Expressions are where the language-specific surface area is the
 * largest. The adapter handles the common shapes (calls,
 * assignments, function expressions, literals) directly and falls
 * back to a generic `expression` node for anything more exotic.
 */

import ts from "typescript";
import type { SemanticNodeId } from "@source-narrator/shared";
import type { SemanticNode, SemanticNodeKind } from "@source-narrator/translator-core/semantic/nodes";
import {
  type AdapterContext,
  identifierName,
  makeNode,
  rangeOf,
  textOf,
} from "./helpers.js";

const MAX_DEPTH = 4;

export const adaptExpression = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  expr: ts.Expression,
  depth: number,
): SemanticNode[] => {
  if (depth > MAX_DEPTH) {
    return [makeNode(ctx, parentId, "expression", null, rangeOf(expr), textOf(expr), { truncated: true })];
  }
  if (ts.isNumericLiteral(expr)) {
    return [
      makeNode(
        ctx,
        parentId,
        "literal",
        expr.text,
        rangeOf(expr),
        `Number literal ${expr.text}.`,
        { kind: "number", value: Number(expr.text) },
      ),
    ];
  }
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
    return [
      makeNode(
        ctx,
        parentId,
        "literal",
        expr.text,
        rangeOf(expr),
        `String literal ${JSON.stringify(expr.text)}.`,
        { kind: "string", value: expr.text },
      ),
    ];
  }
  if (expr.kind === ts.SyntaxKind.TrueKeyword || expr.kind === ts.SyntaxKind.FalseKeyword) {
    const value = expr.kind === ts.SyntaxKind.TrueKeyword;
    return [
      makeNode(ctx, parentId, "literal", value ? "true" : "false", rangeOf(expr), `Boolean literal ${value}.`, { kind: "boolean", value }),
    ];
  }
  if (ts.isCallExpression(expr) || ts.isNewExpression(expr)) {
    const callee = expr.expression;
    const calleeName = ts.isPropertyAccessExpression(callee) ? identifierName(callee.name) : identifierName(callee);
    const args = (expr.arguments ?? []).map((a) => textOf(a));
    return [
      makeNode(
        ctx,
        parentId,
        "call" satisfies SemanticNodeKind,
        calleeName,
        rangeOf(expr),
        `Call${calleeName ? ` to ${calleeName}` : ""}${args.length ? ` with ${args.length} argument${args.length === 1 ? "" : "s"}` : ""}.`,
        { callee: calleeName ?? "anonymous", argCount: args.length },
      ),
    ];
  }
  if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    const left = expr.left;
    const right = expr.right;
    const name = ts.isPropertyAccessExpression(left)
      ? identifierName(left.name)
      : ts.isIdentifier(left)
        ? left.text
        : null;
    return [
      makeNode(
        ctx,
        parentId,
        "assignment",
        name,
        rangeOf(expr),
        `Assign value to ${name ?? "expression"}.`,
        { target: name },
        adaptExpression(ctx, parentId, right, depth + 1),
      ),
    ];
  }
  if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) {
    const body = expr.body
      ? ts.isBlock(expr.body)
        ? expr.body.statements.map((s) => s)
        : [expr.body]
      : [];
    return [
      makeNode(
        ctx,
        parentId,
        "function",
        null,
        rangeOf(expr),
        "An inline function expression.",
        { anonymous: true },
      ),
    ];
  }
  return [makeNode(ctx, parentId, "expression", null, rangeOf(expr), textOf(expr))];
};
