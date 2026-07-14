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
    if (line.nodes.length === 0) continue;
    const lineNumber = i + 1;
    const maxEnd = Math.min(
      Math.max(...line.nodes.map((n) => n.sourceEndLine)),
      lines.length,
    );
    let j = i + 1;
    while (j < lines.length && lines[j].nodes.length === 0) j++;
    const nextStartLine = j < lines.length ? j + 1 : lines.length + 1;
    const span = Math.min(nextStartLine - lineNumber, maxEnd - lineNumber + 1);
    if (span > 1) {
      line.translationRowSpan = span;
      for (let k = i + 1; k < i + span; k++) {
        lines[k].skipTranslation = true;
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
