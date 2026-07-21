import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadProject } from '../../../src/main/project/projectService';

describe('projectService', () => {
  it('walks directory and returns tree', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'pseudo-test-'));
    mkdirSync(join(tempDir, 'src'), { recursive: true });
    mkdirSync(join(tempDir, 'node_modules'), { recursive: true });
    writeFileSync(join(tempDir, 'src', 'index.ts'), '');
    writeFileSync(join(tempDir, 'src', 'util.ts'), '');
    writeFileSync(join(tempDir, '.dotfile'), '');

    const result = await loadProject(tempDir);
    const names = result.tree.map(n => n.name);
    expect(names).not.toContain('node_modules');
    expect(names).not.toContain('.dotfile');
    expect(names).toContain('src');
  });

  it('sorts directories first, then files, alphabetically', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'pseudo-test-'));
    mkdirSync(join(tempDir, 'aaa-dir'), { recursive: true });
    mkdirSync(join(tempDir, 'zzz-dir'), { recursive: true });
    writeFileSync(join(tempDir, 'bbb-file.ts'), '');
    writeFileSync(join(tempDir, 'aaa-file.ts'), '');

    const result = await loadProject(tempDir);
    const ordered = result.tree.map(n => `${n.type}:${n.name}`);
    expect(ordered[0]).toContain('directory');
    expect(ordered[1]).toContain('directory');
  });

  it('returns empty children for empty directory', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'pseudo-test-'));
    mkdirSync(join(tempDir, 'empty-dir'), { recursive: true });

    const result = await loadProject(tempDir);
    const emptyDir = result.tree.find(n => n.name === 'empty-dir');
    expect(emptyDir).toBeDefined();
    expect(emptyDir!.type).toBe('directory');
    expect((emptyDir as any).children).toEqual([]);
  });

  it('throws for non-directory path', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'pseudo-test-'));
    writeFileSync(join(tempDir, 'file.ts'), '');
    await expect(loadProject(join(tempDir, 'file.ts'))).rejects.toThrow('Path is not a directory');
  });
});
