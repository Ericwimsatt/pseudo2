/**
 * Visitor contract for traversing a SemanticGraph. Language adapters
 * use this when converting their AST into semantic nodes; renderers
 * and UI panels may also use it for arbitrary traversals.
 *
 * Kept intentionally small. The graph is itself a tree, so the
 * adapter can also just walk it directly.
 */

import type { SemanticNode } from "../semantic/nodes/semantic-node.js";
import type { SemanticGraph } from "../semantic/semantic-graph.js";

export interface SemanticVisitor {
  enter(node: SemanticNode, depth: number): void | Promise<void>;
  leave(node: SemanticNode, depth: number): void | Promise<void>;
}

export const walkSemantic = async (
  graph: SemanticGraph,
  visitor: SemanticVisitor,
): Promise<void> => {
  const visit = async (node: SemanticNode, depth: number): Promise<void> => {
    await visitor.enter(node, depth);
    for (const c of node.children) await visit(c, depth + 1);
    await visitor.leave(node, depth);
  };
  for (const root of graph.nodes) {
    if (root.parentId === null) await visit(root, 0);
  }
};
