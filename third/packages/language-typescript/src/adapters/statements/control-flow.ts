/**
 * Adapts statements that affect control flow: conditionals, loops,
 * returns, throws, try/catch, switch, break, and continue.
 */

import ts from "typescript";
import type { SemanticNodeId } from "@source-narrator/shared";
import type { SemanticNode } from "@source-narrator/translator-core/semantic/nodes";
import {
  type AdapterContext,
  type AdaptedStatement,
  makeNode,
  nextAdapterId,
  rangeOf,
} from "../helpers.js";
import { adaptBlockBody, dispatchStatement } from "../statement-dispatcher.js";
import { adaptExpression } from "../expression-adapter.js";

export const adaptIfStatement = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  stmt: ts.IfStatement,
): AdaptedStatement => {
  const id = nextAdapterId(ctx.fileId, "conditional", ctx.idSalt, null);
  const thenBody = adaptBlockBody(ctx, id, stmt.thenStatement);
  const elseBody = stmt.elseStatement ? adaptBlockBody(ctx, id, stmt.elseStatement) : [];
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        "conditional",
        null,
        rangeOf(stmt),
        "An if-statement checks a condition.",
        { hasElse: !!stmt.elseStatement },
        [...thenBody, ...elseBody],
      ),
    ],
  };
};

export const adaptForStatement = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  stmt: ts.ForStatement | ts.ForInStatement | ts.ForOfStatement,
): AdaptedStatement => {
  const id = nextAdapterId(ctx.fileId, "loop", ctx.idSalt, null);
  const innerStmt = (stmt as ts.ForStatement | ts.ForInStatement | ts.ForOfStatement).statement;
  const body = adaptBlockBody(ctx, id, innerStmt);
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        "loop",
        null,
        rangeOf(stmt),
        ts.isForOfStatement(stmt) ? "A for-of loop iterates over a collection." : "A loop iterates.",
        { kind: ts.SyntaxKind[stmt.kind] },
        body,
      ),
    ],
  };
};

export const adaptWhileStatement = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  stmt: ts.WhileStatement | ts.DoStatement,
): AdaptedStatement => {
  const id = nextAdapterId(ctx.fileId, "loop", ctx.idSalt, null);
  const body = adaptBlockBody(ctx, id, stmt.statement);
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        "loop",
        null,
        rangeOf(stmt),
        "A while loop runs while a condition is true.",
        { kind: ts.SyntaxKind[stmt.kind] },
        body,
      ),
    ],
  };
};

export const adaptReturnStatement = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  stmt: ts.ReturnStatement,
): AdaptedStatement => {
  const children = stmt.expression ? adaptExpression(ctx, parentId, stmt.expression, 0) : [];
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        "return",
        null,
        rangeOf(stmt),
        stmt.expression ? "A value is returned." : "Nothing is returned.",
        { hasValue: !!stmt.expression },
        children,
      ),
    ],
  };
};

export const adaptThrowStatement = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  stmt: ts.ThrowStatement,
): AdaptedStatement => {
  const children = stmt.expression ? adaptExpression(ctx, parentId, stmt.expression, 0) : [];
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        "expression",
        null,
        rangeOf(stmt),
        "An error is thrown.",
        { kind: "throw" },
        children,
      ),
    ],
  };
};

export const adaptTryStatement = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  stmt: ts.TryStatement,
): AdaptedStatement => {
  const id = nextAdapterId(ctx.fileId, "block", ctx.idSalt, null);
  const tryBody = adaptBlockBody(ctx, id, stmt.tryBlock);
  const catchBody = stmt.catchClause ? adaptBlockBody(ctx, id, stmt.catchClause.block) : [];
  const finallyBody = stmt.finallyBlock ? adaptBlockBody(ctx, id, stmt.finallyBlock) : [];
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        "block",
        null,
        rangeOf(stmt),
        "A try-catch block handles errors.",
        { hasCatch: !!stmt.catchClause, hasFinally: !!stmt.finallyBlock },
        [...tryBody, ...catchBody, ...finallyBody],
      ),
    ],
  };
};

export const adaptSwitchStatement = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  stmt: ts.SwitchStatement,
): AdaptedStatement => {
  const cases: SemanticNode[] = stmt.caseBlock.clauses.flatMap((c) => {
    return c.statements.map((s) => {
      const adapted = dispatchStatement(ctx, parentId, s);
      return adapted.nodes;
    }).flat();
  });
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        "conditional",
        null,
        rangeOf(stmt),
        "A switch statement dispatches to one of several cases.",
        { kind: "switch" },
        cases,
      ),
    ],
  };
};

export const adaptControlFlow = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  stmt: ts.BreakOrContinueStatement,
): AdaptedStatement => ({
  nodes: [
    makeNode(
      ctx,
      parentId,
      "expression",
      null,
      rangeOf(stmt),
      stmt.kind === ts.SyntaxKind.BreakStatement
        ? "Execution breaks out of the loop or switch."
        : "Execution continues to the next iteration.",
      { kind: ts.SyntaxKind[stmt.kind] },
    ),
  ],
});

// Local re-import to avoid a circular typecheck: dispatcher imports this
// file, this file imports the dispatcher for switch bodies.
