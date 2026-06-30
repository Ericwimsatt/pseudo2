/**
 * AST visitor over a parsed TypeScript file. Adapter code can use
 * this for an event-driven traversal in lieu of direct recursion.
 *
 * Status: scaffold.
 */

import type { AstNode } from "../parser/ast-node.js";
import { walkNode } from "../parser/ast-node.js";

export interface AstVisitor {
  enter(node: AstNode, depth: number): void;
  leave(node: AstNode, depth: number): void;
}

export const visitAst = (root: AstNode, visitor: AstVisitor): void => {
  walkNode(root, (node, depth) => {
    visitor.enter(node, depth);
    visitor.leave(node, depth);
  });
};
