import type { SemanticNode } from '../makeSemanticGraph';
import type { LineRenderable, NodeRenderable, ViewModel } from './types';
import { tokenize } from './tokenize';
import { pickLineBucket } from './bucket';

function flattenNodes(nodes: SemanticNode[]): SemanticNode[] {
  const out: SemanticNode[] = [];
  function walk(n: SemanticNode) {
    out.push(n);
    for (const c of n.children) walk(c);
  }
  for (const n of nodes) walk(n);
  return out;
}

function buildLineRenderable(
  lineNumber: number,
  sourceText: string,
  renderables: NodeRenderable[]
): LineRenderable {
  const starting = renderables.filter((r) => r.sourceStartLine === lineNumber);
  const spanning = renderables.filter(
    (r) => r.sourceStartLine < lineNumber && r.sourceEndLine >= lineNumber
  );
  const allBuckets = [...starting, ...spanning].map((r) => r.bucket);
  return {
    lineNumber,
    sourceText,
    bucket: pickLineBucket(allBuckets),
    nodes: starting,
    spanningBuckets: spanning.map((r) => r.bucket),
  };
}

function applyRowSpans(lines: LineRenderable[]): void {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.skipTranslation) continue;
    if (line.nodes.length === 0) continue;
    const maxEnd = Math.min(
      Math.max(...line.nodes.map((n) => n.sourceEndLine)),
      lines.length
    );
    if (maxEnd <= i + 1) continue;
    for (let j = i + 1; j <= maxEnd && j < lines.length; j++) {
      if (lines[j].nodes.length > 0) {
        line.translationRowSpan = j - i;
        for (let k = i + 1; k < j; k++) {
          lines[k].skipTranslation = true;
        }
        break;
      }
      if (j === maxEnd) {
        line.translationRowSpan = maxEnd - i;
        for (let k = i + 1; k <= maxEnd; k++) {
          lines[k].skipTranslation = true;
        }
      }
    }
  }
}

export function buildViewModel(
  nodes: SemanticNode[],
  sourceCode: string
): ViewModel {
  const flat = flattenNodes(nodes);
  const renderables: NodeRenderable[] = flat
    .map(tokenize)
    .filter((r) => r.sourceStartLine > 0);
  const lines = sourceCode.split('\n');
  const out: LineRenderable[] = lines.map((text, i) =>
    buildLineRenderable(i + 1, text, renderables)
  );
  applyRowSpans(out);
  return { lines: out };
}
