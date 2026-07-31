export type NodeBucket =
  | 'import'
  | 'interface'
  | 'function'
  | 'jsx'
  | 'control'
  | 'standard';

export type NodeVariant =
  | 'kw'
  | 'ident'
  | 'tag-name'
  | 'attr-name'
  | 'attr-value'
  | 'string'
  | 'punct'
  | 'param'
  | 'fn-name';

export interface HoverContent {
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
  sections?: TooltipSection[];
  loading?: boolean;
}

export interface DisplaySpan {
  text: string;
  variant?: NodeVariant;
  refPos?: number;
  hasHover?: boolean;
}

export interface DisplayNodeData {
  type: string;
  indent: number;
  spans: DisplaySpan[];
  children: DisplayNodeData[];
  sourceStartLine: number;
  sourceEndLine: number;
  bucket: NodeBucket;
  nested: boolean;
  closeText?: string;
}

export interface BoxLayer {
  depth: number;
  bucket: NodeBucket;
  borderRole: 'start' | 'continue' | 'end' | 'single';
}

export interface LineBoxFragment {
  layers: BoxLayer[];
  contentNode: DisplayNodeData | null;
}

export interface LineRenderable {
  lineNumber: number;
  sourceText: string;
  bucket: NodeBucket;
  nodes: DisplayNodeData[];
  spanningBuckets: NodeBucket[];
  boxFragment: LineBoxFragment | null;
}

export interface ViewModel {
  lines: LineRenderable[];
}

export interface SnippetLine {
  lineNumber: number;
  sourceText: string;
  nodes: DisplayNodeData[];
}

export type TooltipSection =
  | { type: 'definition'; line: number; snippet: SnippetLine[] }
  | { type: 'references'; items: { line: number; filePath: string; snippet: SnippetLine[] }[] }
  | { type: 'type'; text: string };

export interface TooltipData {
  title?: string;
  body?: string;
  metadata?: Record<string, unknown>;
  sections: TooltipSection[];
}

export interface EnrichQuery {
  refPos: number;
  identifier?: string;
}

export type QueryAnswer = TooltipData;
