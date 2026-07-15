import type { SemanticNode } from '../makeSemanticGraph';

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

export interface LineRenderable {
  lineNumber: number;
  sourceText: string;
  bucket: NodeBucket;
  nodes: SemanticNode[];
  spanningBuckets: NodeBucket[];
  translationRowSpan?: number;
  skipTranslation?: boolean;
}

export interface ViewModel {
  lines: LineRenderable[];
}
