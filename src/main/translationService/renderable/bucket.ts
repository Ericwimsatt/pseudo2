import type { NodeBucket } from './types';
import type { SemanticNode } from '../makeSemanticGraph';

export const TYPE_TO_BUCKET: Record<string, NodeBucket> = {
  import: 'import',
  export: 'import',
  interface: 'interface',
  typeAlias: 'interface',
  function: 'function',
  method: 'function',
  class: 'function',
  'jsx-element': 'jsx',
  'jsx-fragment': 'jsx',
  'jsx-list': 'jsx',
  'jsx-filter': 'jsx',
  'jsx-conditional': 'jsx',
  'jsx-conditional-alt': 'jsx',
  'jsx-text': 'jsx',
  'jsx-expression': 'jsx',
  return: 'control',
  if: 'control',
  'otherwise-if': 'control',
  otherwise: 'control',
  loop: 'control',
  variable: 'standard',
  property: 'standard',
  call: 'standard',
};

export const BUCKET_PRIORITY: NodeBucket[] = [
  'jsx',
  'import',
  'interface',
  'function',
  'control',
  'standard',
];

export const BUCKET_STYLES: Record<NodeBucket, string> = {
  import: 'bg-amber-50/60',
  interface: 'bg-violet-50/60',
  function: 'bg-emerald-50/60',
  jsx: 'bg-sky-50/70',
  control: 'bg-rose-50/50',
  standard: '',
};

export const BUCKET_LABELS: Record<NodeBucket, string> = {
  import: 'import',
  interface: 'interface',
  function: 'function',
  jsx: 'jsx',
  control: 'control',
  standard: 'standard',
};

export function bucketForType(type: string): NodeBucket {
  return TYPE_TO_BUCKET[type] ?? 'standard';
}

export function bucketForNode(node: SemanticNode): NodeBucket {
  if (node.type === 'return' && node.metadata.hasJsx) {
    return 'jsx';
  }
  return bucketForType(node.type);
}

export function pickLineBucket(buckets: NodeBucket[]): NodeBucket {
  for (const b of BUCKET_PRIORITY) {
    if (buckets.includes(b)) return b;
  }
  return 'standard';
}
