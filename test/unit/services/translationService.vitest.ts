import { describe, it, expect, beforeEach } from 'vitest';
import { loadFileTranslation } from '../../../src/main/translationService/translationService';
import { setRepoPath, clearCache } from '../../../src/main/translationService/cache/projectCache';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'pseudo-test-'));
  clearCache();
  setRepoPath('');
});

describe('translationService', () => {
  it('loads .ts file and builds view model', async () => {
    setRepoPath(tempDir);
    writeFileSync(join(tempDir, 'test.ts'), 'const x = 1;\n');
    const result = await loadFileTranslation({ path: 'test.ts' });
    expect(result.viewModel.lines.length).toBeGreaterThan(0);
    expect(result.path).toBe('test.ts');
  });

  it('loads .tsx file and builds view model', async () => {
    setRepoPath(tempDir);
    writeFileSync(join(tempDir, 'test.tsx'), 'const el = <div />;\n');
    const result = await loadFileTranslation({ path: 'test.tsx' });
    expect(result.viewModel.lines.length).toBeGreaterThan(0);
    expect(result.path).toBe('test.tsx');
  });

  it('returns empty view model for .js file', async () => {
    setRepoPath(tempDir);
    writeFileSync(join(tempDir, 'test.js'), 'const x = 1;\n');
    const result = await loadFileTranslation({ path: 'test.js' });
    expect(result.viewModel.lines.length).toBeGreaterThan(0);
    expect(result.viewModel.lines.every((l: any) => l.nodes.length === 0)).toBe(true);
  });

  it('returns empty view model for .css file', async () => {
    setRepoPath(tempDir);
    writeFileSync(join(tempDir, 'test.css'), 'body { margin: 0; }\n');
    const result = await loadFileTranslation({ path: 'test.css' });
    expect(result.viewModel.lines.every((l: any) => l.nodes.length === 0)).toBe(true);
  });

  it('throws error for non-existent file', async () => {
    setRepoPath(tempDir);
    await expect(loadFileTranslation({ path: 'nonexistent.ts' })).rejects.toThrow();
  });

  it('throws error when no repo path set', async () => {
    await expect(loadFileTranslation({ path: 'test.ts' })).rejects.toThrow('No repository loaded');
  });
});
