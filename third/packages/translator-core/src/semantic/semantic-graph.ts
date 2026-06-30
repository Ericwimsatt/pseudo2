/**
 * A SemanticGraph represents the language-independent semantic
 * structure of a single file, including nodes and the relationships
 * between them. It is the source of truth that the English renderer
 * consumes.
 *
 * The graph is built incrementally by an adapter; queries below
 * provide read-only access for the UI (Semantic IR panel, Inspector).
 */

import type { FileId, SemanticNodeId } from "@source-narrator/shared";
import type { SemanticNode } from "./nodes/semantic-node.js";
import type { Relationship } from "./relationships/relationship.js";

export interface SemanticGraph {
  readonly fileId: FileId;
  readonly nodes: readonly SemanticNode[];
  readonly relationships: readonly Relationship[];
}

export const emptyGraph = (fileId: FileId): SemanticGraph => ({
  fileId,
  nodes: [],
  relationships: [],
});

export const findNode = (graph: SemanticGraph, id: SemanticNodeId): SemanticNode | null => {
  for (const node of graph.nodes) {
    if (node.id === id) return node;
    const found = findInTree(node, id);
    if (found) return found;
  }
  return null;
};

const findInTree = (root: SemanticNode, id: SemanticNodeId): SemanticNode | null => {
  if (root.id === id) return root;
  for (const c of root.children) {
    const found = findInTree(c, id);
    if (found) return found;
  }
  return null;
};

export const rootNodes = (graph: SemanticGraph): readonly SemanticNode[] =>
  graph.nodes.filter((n) => n.parentId === null);

export const childrenOf = (graph: SemanticGraph, id: SemanticNodeId): readonly SemanticNode[] => {
  const node = findNode(graph, id);
  return node ? node.children : [];
};

export const parentsOf = (graph: SemanticGraph, id: SemanticNodeId): readonly SemanticNode[] => {
  const node = findNode(graph, id);
  if (!node || !node.parentId) return [];
  const parent = findNode(graph, node.parentId);
  return parent ? [parent] : [];
};

export const relationshipsOf = (
  graph: SemanticGraph,
  id: SemanticNodeId,
): { readonly outgoing: readonly Relationship[]; readonly incoming: readonly Relationship[] } => {
  const outgoing = graph.relationships.filter((r) => r.from === id);
  const incoming = graph.relationships.filter((r) => r.to === id);
  return { outgoing, incoming };
};

/**
 * Flatten the graph into a render-ordered list of nodes suitable for
 * the English renderer. The order respects the structural parent-child
 * relationships, with depth-first traversal.
 */
export const flattenForRendering = (graph: SemanticGraph): readonly SemanticNode[] => {
  const out: SemanticNode[] = [];
  const visit = (node: SemanticNode, depth: number): void => {
    out.push({ ...node, metadata: { ...node.metadata, depth } });
    for (const c of node.children) visit(c, depth + 1);
  };
  for (const r of rootNodes(graph)) visit(r, 0);
  return out;
};
