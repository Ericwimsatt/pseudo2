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

export interface InlineToken {
  text: string;
  variant?: NodeVariant;
  classes?: string[];
  hover?: HoverContent;
}

export interface NodeRenderable {
  sourceStartLine: number;
  sourceEndLine: number;
  indent: number;
  bucket: NodeBucket;
  tokens: InlineToken[];
  hover?: HoverContent;
}

export interface LineRenderable {
  lineNumber: number;
  sourceText: string;
  bucket: NodeBucket;
  nodes: NodeRenderable[];
  spanningBuckets: NodeBucket[];
  translationRowSpan?: number;
  skipTranslation?: boolean;
}

export interface ViewModel {
  lines: LineRenderable[];
}
