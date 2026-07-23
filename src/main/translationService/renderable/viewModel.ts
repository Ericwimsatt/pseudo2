import type { SemanticNode } from '../makeSemanticGraph';
import type {
  DisplayNodeData,
  DisplaySpan,
  LineRenderable,
  ViewModel,
  NodeBucket,
  BoxLayer,
  LineBoxFragment,
} from './types';
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

type MutableFragment = { layers: BoxLayer[]; contentNode: DisplayNodeData | null };

function shouldBox(node: DisplayNodeData): boolean {
  return node.children.length > 0 || node.spans.some(s => s.text.includes('\n'));
}

function distributeNode(
  node: DisplayNodeData,
  fragments: MutableFragment[],
  depth: number,
): void {
  const startIdx = node.sourceStartLine - 1;
  const endIdx = node.sourceEndLine - 1;

  if (!shouldBox(node)) {
    if (startIdx === endIdx) {
      const idx = startIdx;
      if (idx >= 0 && idx < fragments.length && !fragments[idx].contentNode) {
        fragments[idx].contentNode = node;
      }
    } else {
      for (let i = startIdx; i <= endIdx; i++) {
        if (i < 0 || i >= fragments.length) continue;
        const isStart = i === startIdx;
        const isEnd = i === endIdx;
        const role: 'start' | 'continue' | 'end' | 'single' =
          isStart && isEnd ? 'single'
          : isStart ? 'start'
          : isEnd ? 'end'
          : 'continue';
        fragments[i].layers.push({ depth, bucket: node.bucket, borderRole: role });
      }
      if (startIdx >= 0 && startIdx < fragments.length && !fragments[startIdx].contentNode) {
        fragments[startIdx].contentNode = node;
      }
    }
    return;
  }

  for (let i = startIdx; i <= endIdx; i++) {
    if (i < 0 || i >= fragments.length) continue;
    const isStart = i === startIdx;
    const isEnd = i === endIdx;
    const role: 'start' | 'continue' | 'end' | 'single' =
      isStart && isEnd ? 'single'
      : isStart ? 'start'
      : isEnd ? 'end'
      : 'continue';

    fragments[i].layers.push({ depth, bucket: node.bucket, borderRole: role });
  }

  const childrenByLine = new Map<number, DisplayNodeData[]>();
  for (const child of node.children) {
    const line = child.sourceStartLine;
    if (!childrenByLine.has(line)) childrenByLine.set(line, []);
    childrenByLine.get(line)!.push(child);
  }

  for (let i = startIdx; i <= endIdx; i++) {
    if (i < 0 || i >= fragments.length) continue;
    const lineNum = i + 1;
    const childrenOnLine = childrenByLine.get(lineNum) || [];

    if (childrenOnLine.length > 0 && endIdx > startIdx) {
      if (i === startIdx) {
        const mergedSpans: DisplaySpan[] = [...node.spans, { text: ' ' }, ...childrenOnLine[0].spans];
        fragments[i].contentNode = {
          ...node,
          spans: mergedSpans,
          children: [],
        };
      } else {
        fragments[i].contentNode = childrenOnLine[0];
      }
    } else if (childrenOnLine.length > 0 && endIdx === startIdx) {
      const mergedSpans: DisplaySpan[] = [...node.spans];
      for (const child of childrenOnLine) {
        mergedSpans.push({ text: '\n' });
        mergedSpans.push(...child.spans);
      }
      fragments[i].contentNode = {
        ...node,
        spans: mergedSpans,
        children: [],
      };
    } else if (i === startIdx && !fragments[i].contentNode) {
      fragments[i].contentNode = node;
    }
  }

  for (const child of node.children) {
    distributeNode(child, fragments, depth + 1);
  }
}

function buildBoxFragments(
  totalLines: number,
  rootNodes: DisplayNodeData[],
): (LineBoxFragment | null)[] {
  const fragments: MutableFragment[] = Array.from(
    { length: totalLines },
    () => ({ layers: [], contentNode: null }),
  );

  for (const root of rootNodes) {
    const idx = root.sourceStartLine - 1;
    if (idx < 0 || idx >= totalLines) continue;
    distributeNode(root, fragments, 0);
  }

  return fragments.map(f =>
    f.layers.length > 0 || f.contentNode
      ? { layers: f.layers, contentNode: f.contentNode }
      : null,
  );
}

function buildLineRenderable(
  lineNumber: number,
  sourceText: string,
  rootNodes: DisplayNodeData[],
  spanning: Set<NodeBucket>,
  boxFragment: LineBoxFragment | null,
): LineRenderable {
  return {
    lineNumber,
    sourceText,
    bucket: rootNodes.length > 0
      ? pickLineBucket(collectTreeBuckets(rootNodes))
      : pickLineBucket([...spanning]),
    nodes: rootNodes,
    spanningBuckets: [...spanning],
    boxFragment,
  };
}

export function buildViewModel(
  nodes: SemanticNode[],
  sourceCode: string
): ViewModel {
  const rootNodes = nodes.filter((n) => n.sourceStartLine > 0).map(toDisplayNode);
  const sourceLines = sourceCode.split('\n');
  const totalLines = sourceLines.length;

  const boxFragments = buildBoxFragments(totalLines, rootNodes);

  const lines = sourceLines.map((text, i) => {
    const lineNumber = i + 1;
    const starting = rootNodes.filter((r) => r.sourceStartLine === lineNumber);
    const spanning = collectActiveBuckets(rootNodes, lineNumber);
    return buildLineRenderable(lineNumber, text, starting, spanning, boxFragments[i]);
  });

  return { lines };
}
