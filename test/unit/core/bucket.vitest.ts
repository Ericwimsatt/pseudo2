import { describe, it, expect } from 'vitest';
import {
  bucketForType,
  bucketForNode,
  pickLineBucket,
  TYPE_TO_BUCKET,
  BUCKET_PRIORITY,
} from '../../../src/main/translationService/renderable/bucket';
import type { SemanticNode } from '../../../src/main/translationService/makeSemanticGraph';

function makeNode(type: string, extra: Partial<SemanticNode> = {}): SemanticNode {
  return {
    type,
    children: [],
    metadata: {},
    sourceStartLine: 1,
    sourceEndLine: 1,
    ...extra,
  };
}

describe('bucketForType', () => {
  it('returns import bucket for import', () => {
    expect(bucketForType('import')).toBe('import');
  });

  it('returns import bucket for export', () => {
    expect(bucketForType('export')).toBe('import');
  });

  it('returns interface bucket for interface', () => {
    expect(bucketForType('interface')).toBe('interface');
  });

  it('returns interface bucket for typeAlias', () => {
    expect(bucketForType('typeAlias')).toBe('interface');
  });

  it('returns function bucket for function-definition', () => {
    expect(bucketForType('function-definition')).toBe('function');
  });

  it('returns function bucket for class', () => {
    expect(bucketForType('class')).toBe('function');
  });

  it('returns jsx bucket for jsx-element', () => {
    expect(bucketForType('jsx-element')).toBe('jsx');
  });

  it('returns control bucket for if', () => {
    expect(bucketForType('if')).toBe('control');
  });

  it('returns control bucket for return', () => {
    expect(bucketForType('return')).toBe('control');
  });

  it('returns standard bucket for variable-assignment', () => {
    expect(bucketForType('variable-assignment')).toBe('standard');
  });

  it('returns standard bucket for unknown type', () => {
    expect(bucketForType('unknownType')).toBe('standard');
  });

  it('all known types have a bucket', () => {
    const knownTypes = [
      'import', 'export', 'interface', 'typeAlias', 'function-definition',
      'class', 'jsx-element', 'jsx-fragment', 'jsx-list', 'jsx-filter',
      'jsx-conditional', 'jsx-conditional-alt', 'jsx-text', 'jsx-expression',
      'return', 'if', 'otherwise-if', 'otherwise', 'loop',
      'variable-assignment', 'property', 'call-function',
      'object-literal', 'object-property', 'object-literal-close',
    ];
    for (const t of knownTypes) {
      expect(TYPE_TO_BUCKET[t]).toBeDefined();
    }
  });
});

describe('bucketForNode', () => {
  it('returns jsx for return-jsx', () => {
    const node = makeNode('return-jsx', { metadata: { hasJsx: true } });
    expect(bucketForNode(node)).toBe('jsx');
  });

  it('returns control for return', () => {
    const node = makeNode('return', { metadata: { hasJsx: false } });
    expect(bucketForNode(node)).toBe('control');
  });

  it('delegates to bucketForType for other nodes', () => {
    const node = makeNode('import');
    expect(bucketForNode(node)).toBe('import');
  });
});

describe('pickLineBucket', () => {
  it('returns jsx when jsx is present', () => {
    expect(pickLineBucket(['standard', 'jsx', 'control'])).toBe('jsx');
  });

  it('returns highest priority bucket', () => {
    expect(pickLineBucket(['standard', 'control'])).toBe('control');
    expect(pickLineBucket(['standard'])).toBe('standard');
  });

  it('returns import when no higher priority', () => {
    expect(pickLineBucket(['import', 'standard'])).toBe('import');
  });

  it('returns standard for empty list', () => {
    expect(pickLineBucket([])).toBe('standard');
  });

  it('priority order is correct', () => {
    expect(BUCKET_PRIORITY).toEqual(['jsx', 'import', 'interface', 'function', 'control', 'standard']);
  });
});
