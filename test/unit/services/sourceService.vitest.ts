import { describe, it, expect, beforeEach } from 'vitest';
import { loadFileSource } from '../../../src/main/sourceService/sourceService';
import { setRepoPath } from '../../../src/main/translationService/cache/projectCache';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'pseudo-test-'));
  setRepoPath('');
});

describe('sourceService', () => {
  it('reads a real file and returns correct lines', async () => {
    setRepoPath(tempDir);
    writeFileSync(join(tempDir, 'test.ts'), 'line1\nline2\nline3');
    const result = await loadFileSource({ path: 'test.ts' });
    expect(result.lines.length).toBe(3);
    expect(result.lines[0].lineNumber).toBe(1);
    expect(result.lines[0].text).toBe('line1');
    expect(result.lines[1].lineNumber).toBe(2);
    expect(result.lines[1].text).toBe('line2');
    expect(result.lines[2].lineNumber).toBe(3);
    expect(result.lines[2].text).toBe('line3');
  });

  it('returns empty lines array for empty file', async () => {
    setRepoPath(tempDir);
    writeFileSync(join(tempDir, 'empty.ts'), '');
    const result = await loadFileSource({ path: 'empty.ts' });
    expect(result.lines.length).toBe(1);
    expect(result.lines[0].text).toBe('');
  });

  it('handles file with trailing newline', async () => {
    setRepoPath(tempDir);
    writeFileSync(join(tempDir, 'test.ts'), 'line1\nline2');
    const result = await loadFileSource({ path: 'test.ts' });
    expect(result.lines.length).toBe(2);
    expect(result.lines[1].text).toBe('line2');
  });

  it('throws error when no repo path set', async () => {
    await expect(loadFileSource({ path: 'test.ts' })).rejects.toThrow('No repository loaded');
  });
});
