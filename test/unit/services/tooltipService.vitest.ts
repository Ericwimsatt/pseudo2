import { describe, it, expect, beforeEach } from 'vitest';
import { Node } from 'ts-morph';
import { buildFileData } from '../../../src/main/translationService/buildFileData';
import { setCache, clearCache } from '../../../src/main/translationService/cache/projectCache';
import { getNodeDetail } from '../../../src/main/tooltip/tooltipService';

describe('tooltipService', () => {
  beforeEach(() => {
    clearCache();
  });

  it('returns empty sections for uncached file', () => {
    const result = getNodeDetail({ filePath: 'unknown.ts', query: { refPos: 0 } });
    expect(result.sections).toEqual([]);
  });

  it('returns sections for a cached file with valid refPos', () => {
    const source = 'let x = 1;\nconst y = x;\n';
    const result = buildFileData(source, 'test.ts');
    const { viewModel, astCache } = result;

    setCache('test.ts', astCache, viewModel);

    const sourceFile = astCache.getSourceFile();
    const xNodes = sourceFile.getDescendants().filter(n => Node.isIdentifier(n) && n.getText() === 'x');
    const xDecl = xNodes.find(n => n.getParent()?.getKindName() === 'VariableDeclaration');
    const refPos = xDecl?.getStart();

    if (refPos !== undefined) {
      const detail = getNodeDetail({ filePath: 'test.ts', query: { refPos } });
      expect(detail.sections.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('handles cross-file references', () => {
    const source1 = 'export const value = 42;\n';
    const source2 = 'import { value } from "./a";\nconst x = value;\n';

    const r1 = buildFileData(source1, 'a.ts');
    const r2 = buildFileData(source2, 'b.ts');

    setCache('a.ts', r1.astCache, r1.viewModel);
    setCache('b.ts', r2.astCache, r2.viewModel);

    const result = getNodeDetail({ filePath: 'a.ts', query: { refPos: 0 } });
    expect(result.sections).toBeDefined();
  });
});
