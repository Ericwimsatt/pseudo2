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
}

export interface DisplaySpan {
  text: string;
  variant?: NodeVariant;
  hover?: HoverContent;
  /** 0-based character offset for async enrichment queries (AstCache) */
  refPos?: number;
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

// ── Query-based enrichment API ──────────────────────────────────────

export type EnrichQuery =
  | { kind: 'definition'; refPos: number }
  | { kind: 'references'; refPos: number }
  | { kind: 'type'; refPos: number };

export type QueryAnswer =
  | { kind: 'definition'; data: DefinitionData | null }
  | { kind: 'references'; data: ReferencesData }
  | { kind: 'type'; data: TypeData | null };

export interface DefinitionData {
  line: number;
  text: string;
}

export interface ReferencesData {
  list: { line: number; isWrite: boolean }[];
}

export interface TypeData {
  text: string;
}
