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
    if (node.type === 'variable-assignment-target') {
      // The value of an assignment (`x = …`) starts on the same source line
      // as the LHS. Inline it after the `= ` instead of pushing it onto a
      // new, deeper-indented line — the latter produced a visual staircase
      // (`x = \n  call y { \n    … }`) that misaligned the LHS and its
      // value. The value's own nested children (inside a `{` block) still
      // render on separate indented lines via the nested branch below.
      for (const child of sameLineChildren) {
        const lastText = spans.length > 0 ? spans[spans.length - 1].text : '';
        if (lastText && !/\s$/.test(lastText)) spans.push({ text: ' ' });
        spans.push(...collectStartLineSpans(child, lineNum));
      }
    } else {
      // Block-structured child rendering: each child on its own line,
      // indented one `INDENT_UNIT` past the parent's own column. INDENT is
      // expressed relative to the parent's indent so the visual staircase
      // (and the close-brace alignment) is consistent regardless of the
      // absolute nesting depth of the surrounding box layers.
      spans.push({ text: '\n' });
      for (let i = 0; i < sameLineChildren.length; i++) {
        spans.push({ text: INDENT_UNIT.repeat(Math.max(0, sameLineChildren[i].indent - node.indent)) });
        spans.push(...collectStartLineSpans(sameLineChildren[i], lineNum));
        if (i < sameLineChildren.length - 1) spans.push({ text: '\n' });
      }
      spans.push({ text: '\n' });
      if (node.closeText && node.sourceStartLine === node.sourceEndLine) {
        // Align the close brace with the opening keyword (the parent's own
        // column), not with the absolute nesting depth — that previously
        // pushed `}` further right than its ` {` opener.
        spans.push({ text: node.closeText });
      }
    }
  } else if (node.closeText && node.sourceStartLine === node.sourceEndLine) {
    spans.push({ text: node.closeText });
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
      // The node header lives on this line; its descendants start on later
      // lines and get their own rows via the recursion below. Drop children
      // so the renderer (which walks `node.children`) doesn't replay the
      // entire subtree on every ancestor's start line.
      fragments[startIdx].contentNode = {
        ...node,
        children: [],
      };
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
        type: node.type,
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