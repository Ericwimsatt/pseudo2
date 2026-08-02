import type { NodeBucket } from './types';
import type { SemanticNode } from '../makeSemanticGraph';

export const TYPE_TO_BUCKET: Record<string, NodeBucket> = {
  import: 'import',
  export: 'import',
  interface: 'interface',
  typeAlias: 'interface',
  'type-alias-line': 'interface',
  'function-definition': 'function',
  class: 'function',
  'jsx-element': 'jsx',
  'jsx-fragment': 'jsx',
  'jsx-list': 'jsx',
  'jsx-filter': 'jsx',
  'jsx-conditional': 'jsx',
  'jsx-conditional-alt': 'jsx',
  'jsx-text': 'jsx',
  'jsx-expression': 'jsx',
  'return': 'control',
  'return-jsx': 'jsx',
  'return-value': 'control',
  'return-target': 'control',
  if: 'control',
  'otherwise-if': 'control',
  otherwise: 'control',
  loop: 'control',
  'variable-assignment': 'standard',
  'variable-assignment-target': 'standard',
  property: 'standard',
  'call-function': 'standard',
  'object-literal': 'standard',
  'object-property': 'standard',
  'object-literal-close': 'standard',
  'ternary-condition': 'standard',
  'ternary-otherwise': 'standard',
  'ternary-value': 'standard',
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
  import: '',
  interface: '',
  function: '',
  jsx: '',
  control: '',
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
  return bucketForType(node.type);
}

export function pickLineBucket(buckets: NodeBucket[]): NodeBucket {
  for (const b of BUCKET_PRIORITY) {
    if (buckets.includes(b)) return b;
  }
  return 'standard';
}
