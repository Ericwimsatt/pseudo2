import type { SemanticNode } from '../makeSemanticGraph';
import type { LineRenderable, ViewModel } from './types';
import { bucketForNode, pickLineBucket } from './bucket';
import { toDisplayNode } from './phrasing';

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
  starting: SemanticNode[],
  spanning: SemanticNode[]
): LineRenderable {
  const buckets = [...starting, ...spanning].map((n) => bucketForNode(n));
  return {
    lineNumber,
    sourceText,
    bucket: pickLineBucket(buckets),
    nodes: starting.map(toDisplayNode),
    spanningBuckets: spanning.map((n) => bucketForNode(n)),
  };
}

function applyRowSpans(lines: LineRenderable[], startingByLine: SemanticNode[][]): void {
  for (let i = 0; i < lines.length; i++) {
    const starting = startingByLine[i];
    if (starting.length === 0) continue;
    const lineNumber = i + 1;
    const maxEnd = Math.min(
      Math.max(...starting.map((n) => n.sourceEndLine)),
      lines.length,
    );
    let j = i + 1;
    while (j < lines.length && lines[j].nodes.length === 0) j++;
    const nextStartLine = j < lines.length ? j + 1 : lines.length + 1;
    const span = Math.min(nextStartLine - lineNumber, maxEnd - lineNumber + 1);
    if (span > 1) {
      lines[i].translationRowSpan = span;
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
  const flat = flattenNodes(nodes).filter((n) => n.sourceStartLine > 0);
  const sourceLines = sourceCode.split('\n');
  const startingByLine: SemanticNode[][] = [];
  const lines = sourceLines.map((text, i) => {
    const lineNumber = i + 1;
    const starting = flat.filter((r) => r.sourceStartLine === lineNumber);
    const spanning = flat.filter(
      (r) => r.sourceStartLine < lineNumber && r.sourceEndLine >= lineNumber
    );
    startingByLine.push(starting);
    return buildLineRenderable(lineNumber, text, starting, spanning);
  });
  applyRowSpans(lines, startingByLine);
  return { lines };
}
