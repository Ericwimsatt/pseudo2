import type { SemanticNode } from '../makeSemanticGraph';
import type { DisplayNodeData, LineRenderable, ViewModel, NodeBucket } from './types';
import { pickLineBucket } from './bucket';
import { toDisplayNode } from './phrasing';

function collectTreeBuckets(nodes: DisplayNodeData[]): NodeBucket[] {
  const set = new Set<NodeBucket>();
  function walk(ns: DisplayNodeData[]) {
    for (const n of ns) {
      set.add(n.bucket);
      walk(n.children);
    }
  }
  walk(nodes);
  return [...set];
}

function collectActiveBuckets(nodes: DisplayNodeData[], lineNumber: number): Set<NodeBucket> {
  const buckets = new Set<NodeBucket>();
  function walk(ns: DisplayNodeData[]) {
    for (const n of ns) {
      if (n.sourceStartLine > lineNumber) continue;
      if (n.sourceEndLine >= lineNumber) {
        buckets.add(n.bucket);
        walk(n.children);
      }
    }
  }
  walk(nodes);
  return buckets;
}

function applyRowSpans(lines: LineRenderable[], startingByLine: DisplayNodeData[][]): void {
  const totalLines = lines.length;
  for (let i = 0; i < totalLines; i++) {
    const starting = startingByLine[i];
    if (starting.length === 0) continue;
    const lineNumber = i + 1;
    const maxEnd = Math.min(
      Math.max(...starting.map((n) => n.sourceEndLine)),
      totalLines,
    );
    let j = i + 1;
    while (j < totalLines && startingByLine[j].length === 0) j++;
    const nextStartLine = j < totalLines ? j + 1 : totalLines + 1;
    const span = Math.min(nextStartLine - lineNumber, maxEnd - lineNumber + 1);
    if (span > 1) {
      lines[i].translationRowSpan = span;
      for (let k = i + 1; k < i + span; k++) {
        lines[k].skipTranslation = true;
      }
    }
  }
}

function buildLineRenderable(
  lineNumber: number,
  sourceText: string,
  rootNodes: DisplayNodeData[],
  spanning: Set<NodeBucket>,
): LineRenderable {
  return {
    lineNumber,
    sourceText,
    bucket: rootNodes.length > 0
      ? pickLineBucket(collectTreeBuckets(rootNodes))
      : pickLineBucket([...spanning]),
    nodes: rootNodes,
    spanningBuckets: [...spanning],
  };
}

export function buildViewModel(
  nodes: SemanticNode[],
  sourceCode: string
): ViewModel {
  const rootNodes = nodes.filter((n) => n.sourceStartLine > 0).map(toDisplayNode);
  const sourceLines = sourceCode.split('\n');
  const startingByLine: DisplayNodeData[][] = [];
  const lines = sourceLines.map((text, i) => {
    const lineNumber = i + 1;
    const starting = rootNodes.filter((r) => r.sourceStartLine === lineNumber);
    startingByLine.push(starting);
    const spanning = collectActiveBuckets(rootNodes, lineNumber);
    return buildLineRenderable(lineNumber, text, starting, spanning);
  });
  applyRowSpans(lines, startingByLine);
  return { lines };
}
