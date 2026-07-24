import type { DisplaySpan } from './types';
import type { SemanticNode } from '../makeSemanticGraph';
import type {
  DisplayNodeData,
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

const INDENT_UNIT = '  ';

function collectStartLineSpans(node: DisplayNodeData, lineNum: number): DisplaySpan[] {
  const spans: DisplaySpan[] = [...node.spans];
  const sameLineChildren = node.children.filter(c => c.sourceStartLine === lineNum);
  if (sameLineChildren.length > 0) {
    spans.push({ text: '\n' });
    for (let i = 0; i < sameLineChildren.length; i++) {
      const child = sameLineChildren[i];
      spans.push({ text: INDENT_UNIT.repeat(child.indent) });
      spans.push(...collectStartLineSpans(child, lineNum));
      if (i < sameLineChildren.length - 1) spans.push({ text: '\n' });
    }
    spans.push({ text: '\n' });
    if (node.closeText && node.sourceStartLine === node.sourceEndLine) {
      spans.push({ text: INDENT_UNIT.repeat(node.indent) });
      spans.push({ text: node.closeText });
    }
  }
  return spans;
}

function distributeNode(
  node: DisplayNodeData,
  fragments: MutableFragment[],
  depth: number,
): void {
  const startIdx = node.sourceStartLine - 1;
  const endIdx = node.sourceEndLine - 1;

  if (node.nested) {
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
  }

  if (startIdx >= 0 && startIdx < fragments.length && !fragments[startIdx].contentNode) {
    const lineNum = startIdx + 1;
    const sameLineChildren = node.children.filter(c => c.sourceStartLine === lineNum);
    if (sameLineChildren.length > 0) {
      fragments[startIdx].contentNode = {
        ...node,
        spans: collectStartLineSpans(node, lineNum),
        children: [],
      };
    } else if (startIdx === endIdx && node.closeText) {
      fragments[startIdx].contentNode = {
        ...node,
        spans: [...node.spans, { text: '\n' }, { text: node.closeText }],
        children: [],
      };
    } else {
      fragments[startIdx].contentNode = node;
    }
  }

  for (const child of node.children) {
    distributeNode(child, fragments, depth + 1);
  }

  if (node.closeText && endIdx !== startIdx && endIdx >= 0 && endIdx < fragments.length) {
    const existing = fragments[endIdx].contentNode;
    if (existing) {
      fragments[endIdx].contentNode = {
        ...existing,
        spans: [...existing.spans, { text: '\n' }, { text: node.closeText }],
      };
    } else {
      fragments[endIdx].contentNode = {
        indent: node.indent,
        spans: [{ text: node.closeText }],
        children: [],
        sourceStartLine: node.sourceEndLine,
        sourceEndLine: node.sourceEndLine,
        bucket: node.bucket,
        nested: false,
      };
    }
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
  const rootNodes = nodes.filter((n) => n.sourceStartLine > 0).map(n => toDisplayNode(n));
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