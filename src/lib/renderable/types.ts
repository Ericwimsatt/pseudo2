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
  hover?: HoverContent;
  /** 0-based character offset for async enrichment queries (AstCache) */
  refPos?: number;
  /** If true, this span triggers a tooltip on hover */
  hasHover?: boolean;
}

export interface DisplayNodeData {
  indent: number;
  spans: DisplaySpan[];
}

export interface LineRenderable {
  lineNumber: number;
  sourceText: string;
  bucket: NodeBucket;
  nodes: DisplayNodeData[];
  spanningBuckets: NodeBucket[];
  translationRowSpan?: number;
  skipTranslation?: boolean;
}

export interface ViewModel {
  lines: LineRenderable[];
}

// ── Tooltip / enrichment API ────────────────────────────────────────

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
  sections: TooltipSection[];
}

export interface EnrichQuery {
  refPos: number;
}

export type QueryAnswer = TooltipData;
