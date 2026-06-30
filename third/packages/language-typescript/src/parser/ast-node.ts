/**
 * Plain-data AST node produced by the TypeScript parser. We convert
 * the live ts.Node tree into this serialisable form so it can be
 * stored in the AST panel and inspected safely.
 *
 * The id is derived from the source range (start + end positions) and
 * the kind, which makes it stable across rebuilds of the same file.
 */

import type { SourceRange } from "@source-narrator/shared";
import { asAstNodeId, type AstNodeId } from "@source-narrator/shared";

export interface AstNode {
  readonly id: AstNodeId;
  readonly parentId: AstNodeId | null;
  readonly kind: number;
  readonly kindName: string;
  readonly range: SourceRange;
  readonly text: string;
  readonly flags: number;
  readonly children: readonly AstNode[];
}

export type { AstNodeId };

/**
 * Construct a stable id from the source range and kind. This keeps
 * node identity stable when the same source file is reparsed.
 */
export const astIdFromRange = (
  kind: number,
  range: SourceRange,
  salt: number,
): AstNodeId =>
  asAstNodeId(
    `ast-k${kind}-${range.start.line}:${range.start.column}-${range.end.line}:${range.end.column}-s${salt}`,
  );

export const findNode = (root: AstNode, id: AstNodeId): AstNode | null => {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
};

export const walkNode = (root: AstNode, visit: (node: AstNode, depth: number) => void): void => {
  const walk = (n: AstNode, depth: number): void => {
    visit(n, depth);
    for (const c of n.children) walk(c, depth + 1);
  };
  walk(root, 0);
};
