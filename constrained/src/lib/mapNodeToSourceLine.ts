import type { SemanticNode } from './makeSemanticGraph';

export function mapNodeToSourceLine(node: SemanticNode): number {
  return node.sourceStartLine;
}
