/**
 * Adapts top-level declarations: functions, classes, interfaces,
 * type aliases, and enums.
 */

import ts from "typescript";
import type { SemanticNodeId } from "@source-narrator/shared";
import type { SemanticNode } from "@source-narrator/translator-core/semantic/nodes";
import {
  type AdapterContext,
  type AdaptedStatement,
  bindingName,
  hasExportModifier,
  hasModifier,
  identifierName,
  makeNode,
  nextAdapterId,
  rangeOf,
} from "../helpers.js";
import { adaptBlockBody } from "../statement-dispatcher.js";

export const adaptFunctionDeclaration = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  decl: ts.FunctionDeclaration,
): AdaptedStatement => {
  const name = decl.name ? decl.name.text : null;
  const id = nextAdapterId(ctx.fileId, "function", ctx.idSalt, name);
  const body = decl.body ? adaptBlockBody(ctx, id, decl.body) : [];
  const params = decl.parameters.map((p) => {
    const pname = bindingName(p.name) ?? "?";
    return makeNode(
      ctx,
      id,
      "parameter",
      pname,
      rangeOf(p),
      `Parameter ${pname}.`,
      { optional: !!p.questionToken, hasDefault: !!p.initializer },
    );
  });
  const children: SemanticNode[] = [...params, ...body];
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        "function",
        name,
        rangeOf(decl),
        name ? `Function ${name} is defined.` : "An anonymous function is defined.",
        {
          exported: hasExportModifier(decl),
          async: hasModifier(decl, ts.SyntaxKind.AsyncKeyword),
        },
        children,
      ),
    ],
  };
};

export const adaptClassDeclaration = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  decl: ts.ClassDeclaration,
): AdaptedStatement => {
  const name = decl.name ? decl.name.text : null;
  const id = nextAdapterId(ctx.fileId, "class", ctx.idSalt, name);
  const members: SemanticNode[] = [];
  for (const member of decl.members) {
    if (ts.isMethodDeclaration(member) || ts.isConstructorDeclaration(member)) {
      members.push(adaptMethodMember(ctx, id, member));
    } else if (ts.isPropertyDeclaration(member)) {
      const pname = member.name ? (identifierName(member.name) ?? "?") : "?";
      members.push(
        makeNode(
          ctx,
          id,
          "property",
          pname,
          rangeOf(member),
          pname ? `Property ${pname} is declared.` : "A property is declared.",
          { static: hasModifier(member, ts.SyntaxKind.StaticKeyword) },
        ),
      );
    }
  }
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        "class",
        name,
        rangeOf(decl),
        name ? `Class ${name} is defined.` : "An anonymous class is defined.",
        { exported: hasExportModifier(decl) },
        members,
      ),
    ],
  };
};

const adaptMethodMember = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  member: ts.MethodDeclaration | ts.ConstructorDeclaration,
): SemanticNode => {
  const name = ts.isConstructorDeclaration(member) ? "constructor" : (member.name ? identifierName(member.name) : null);
  const id = nextAdapterId(ctx.fileId, "method", ctx.idSalt, name);
  const body = member.body ? adaptBlockBody(ctx, id, member.body) : [];
  const params = (member.parameters ?? []).map((p) => {
    const pname = bindingName(p.name) ?? "?";
    return makeNode(
      ctx,
      id,
      "parameter",
      pname,
      rangeOf(p),
      `Parameter ${pname}.`,
      { optional: !!p.questionToken },
    );
  });
  return makeNode(
    ctx,
    parentId,
    "method",
    name,
    rangeOf(member),
    name === "constructor" ? "The constructor is defined." : `Method ${name} is defined.`,
    { static: hasModifier(member, ts.SyntaxKind.StaticKeyword) },
    [...params, ...body],
  );
};

export const adaptInterfaceDeclaration = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  decl: ts.InterfaceDeclaration,
): AdaptedStatement => {
  const members: SemanticNode[] = decl.members.map((m) => {
    const mname = m.name ? (identifierName(m.name) ?? "?") : "?";
    return makeNode(
      ctx,
      parentId,
      "property",
      mname,
      rangeOf(m),
      `Member ${mname} is declared.`,
    );
  });
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        "interface",
        decl.name.text,
        rangeOf(decl),
        `Interface ${decl.name.text} is defined.`,
        { exported: hasExportModifier(decl) },
        members,
      ),
    ],
  };
};

export const adaptTypeAliasDeclaration = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  decl: ts.TypeAliasDeclaration,
): AdaptedStatement => ({
  nodes: [
    makeNode(
      ctx,
      parentId,
      "type-alias",
      decl.name.text,
      rangeOf(decl),
      `Type alias ${decl.name.text} is defined.`,
      { exported: hasExportModifier(decl) },
    ),
  ],
});

export const adaptEnumDeclaration = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  decl: ts.EnumDeclaration,
): AdaptedStatement => {
  const members: SemanticNode[] = decl.members.map((m) =>
    makeNode(
      ctx,
      parentId,
      "property",
      identifierName(m.name) ?? "?",
      rangeOf(m),
      `Enum member ${identifierName(m.name) ?? "?"}.`,
    ),
  );
  return {
    nodes: [
      makeNode(
        ctx,
        parentId,
        "type-alias",
        decl.name.text,
        rangeOf(decl),
        `Enum ${decl.name.text} is defined.`,
        { kind: "enum" },
        members,
      ),
    ],
  };
};
