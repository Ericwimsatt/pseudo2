/**
 * Common helpers for the TypeScript semantic adapter. Keeping
 * these in one place avoids duplicating the trivial node-construction
 * and identifier-extraction logic across the per-kind adapter files.
 */

import ts from "typescript";
import { asSemanticNodeId, type SourceRange, type SemanticNodeId } from "@source-narrator/shared";
import type {
  SemanticNode,
  SemanticNodeKind,
} from "@source-narrator/translator-core/semantic/nodes";

export interface AdapterContext {
  readonly fileId: string;
  /** A monotonically increasing counter to keep ids stable within a file. */
  readonly idSalt: number;
}

export interface AdaptedStatement {
  /** Direct semantic nodes produced for this statement. */
  readonly nodes: readonly SemanticNode[];
}

let adapterCounter = 0;
export const nextAdapterId = (
  fileId: string,
  kind: SemanticNodeKind,
  salt: number,
  name: string | null,
): SemanticNodeId => {
  adapterCounter += 1;
  const base = name ? `${kind}:${name}` : kind;
  return asSemanticNodeId(`${fileId}::${base}::${salt}::${adapterCounter.toString(36)}`);
};

const trimName = (text: string, max = 80): string => (text.length <= max ? text : `${text.slice(0, max - 1)}…`);

export const rangeOf = (node: ts.Node): SourceRange => {
  const sf = node.getSourceFile();
  const start = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  const end = sf.getLineAndCharacterOfPosition(node.getEnd());
  return {
    start: { line: start.line + 1, column: start.character + 1 },
    end: { line: end.line + 1, column: end.character + 1 },
  };
};

export const textOf = (node: ts.Node): string => trimName(node.getText());

export const makeNode = (
  ctx: AdapterContext,
  parentId: SemanticNodeId,
  kind: SemanticNodeKind,
  name: string | null,
  range: SourceRange,
  text: string,
  meta: Record<string, unknown> = {},
  children: readonly SemanticNode[] = [],
  references: readonly SemanticNodeId[] = [],
): SemanticNode => {
  const id = nextAdapterId(ctx.fileId, kind, ctx.idSalt, name);
  return {
    id,
    fileId: ctx.fileId as SemanticNode["fileId"],
    kind,
    name,
    text,
    source: range,
    parentId,
    children,
    references,
    metadata: meta,
  };
};

/** Extract a name from a node that is allowed to identify a binding. */
export const identifierName = (node: ts.Node): string | null => {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return node.text;
  if (ts.isPrivateIdentifier(node)) return `#${node.text}`;
  return null;
};

/** Render a binding pattern as a string. */
export const bindingName = (node: ts.BindingName): string | null => {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isObjectBindingPattern(node)) {
    return `{ ${node.elements.map((e) => bindingName(e.name) ?? "?").join(", ")} }`;
  }
  if (ts.isArrayBindingPattern(node)) {
    return `[ ${node.elements
      .map((e) => (ts.isBindingElement(e) ? (bindingName(e.name) ?? "?") : ts.isOmittedExpression(e) ? "..." : "?"))
      .join(", ")} ]`;
  }
  return null;
};

export const hasExportModifier = (node: ts.Node): boolean =>
  !!ts.canHaveModifiers(node) && !!ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

export const hasModifier = (node: ts.Node, kind: ts.SyntaxKind): boolean =>
  !!ts.canHaveModifiers(node) && !!ts.getModifiers(node)?.some((m) => m.kind === kind);
