import type { SemanticNode } from './makeSemanticGraph';
import { tokenize } from './renderable/tokenize';

export interface TranslationItem {
  text: string;
  endLine: number;
}

function processNode(
  node: SemanticNode,
  out: Record<number, TranslationItem[]>,
  renderedLines: Set<number>
) {
  if (node.sourceStartLine <= 0) return;
  const isJsxRender = node.type === 'return' && node.metadata.hasJsx;
  if (isJsxRender && renderedLines.has(node.sourceStartLine)) return;
  if (isJsxRender) renderedLines.add(node.sourceStartLine);
  const r = tokenize(node);
  const text = r.tokens.map((t) => t.text).join('');
  if (!out[node.sourceStartLine]) out[node.sourceStartLine] = [];
  out[node.sourceStartLine].push({ text, endLine: node.sourceEndLine });
  for (const child of node.children) {
    processNode(child, out, renderedLines);
  }
}

export function translateGraph(nodes: SemanticNode[]): Record<number, TranslationItem[]> {
  const out: Record<number, TranslationItem[]> = {};
  const renderedLines = new Set<number>();
  for (const node of nodes) {
    processNode(node, out, renderedLines);
  }
  return out;
}
