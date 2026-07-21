import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { buildFileData } from '../../src/main/translationService/buildFileData';
import type { ViewModel } from '../../src/main/translationService/renderable/types';

export interface FixtureFileEntry {
  viewModel: ViewModel;
  sourceLines: { lineNumber: number; text: string }[];
}

export interface FixtureData {
  tree: { name: string; path: string; type: 'file' | 'directory' }[];
  files: Map<string, FixtureFileEntry>;
  repoPath: string;
}

async function walkDir(dir: string, baseDir: string): Promise<FixtureData> {
  const tree: { name: string; path: string; type: 'file' | 'directory' }[] = [];
  const files = new Map<string, FixtureFileEntry>();

  const entries = await readdir(dir, { withFileTypes: true });
  const sorted = entries
    .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules')
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  for (const entry of sorted) {
    const fullPath = join(dir, entry.name);
    const relPath = relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      const sub = await walkDir(fullPath, baseDir);
      tree.push({ name: entry.name, path: relPath, type: 'directory' });
      tree.push(...sub.tree);
      for (const [k, v] of sub.files) {
        files.set(k, v);
      }
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      tree.push({ name: entry.name, path: relPath, type: 'file' });
      const source = await readFile(fullPath, 'utf-8');
      const { viewModel } = buildFileData(source, relPath);
      const sourceLines = viewModel.lines.map((l) => ({
        lineNumber: l.lineNumber,
        text: l.sourceText,
      }));
      files.set(relPath, { viewModel, sourceLines });
    }
  }

  return { tree, files, repoPath: baseDir };
}

export async function loadFixtureRepo(fixtureDir: string): Promise<FixtureData> {
  const resolved = join(import.meta.dirname, 'repos', fixtureDir);
  const baseDir = resolved;
  return walkDir(resolved, baseDir);
}
