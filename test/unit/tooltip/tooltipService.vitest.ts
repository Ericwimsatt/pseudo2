import { describe, expect, it } from 'vitest';
import { getNodeDetail } from '../../../src/main/tooltip/tooltipService';

describe('tooltipService', () => {
  it('returns static content for module hover queries without requiring an AST cache', () => {
    expect(getNodeDetail({
      filePath: 'Imports.ts',
      query: { identifier: 'react', kind: 'module' },
    })).toEqual({
      title: 'Module',
      body: 'react',
      sections: [],
    });
  });
});
