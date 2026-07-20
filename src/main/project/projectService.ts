import { join, relative, resolve } from 'path';
import { tmpdir } from 'os';
import { mkdir, mkdtemp, readdir, stat, writeFile } from 'fs/promises';
import type { FileNode } from '../../shared/api';
import { setRepoPath, getRepoPath } from '../cache/projectCache';

async function buildFileTree(dirPath: string, basePath: string): Promise<FileNode[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }

    const fullPath = join(dirPath, entry.name);
    const relativePath = relative(basePath, fullPath);

    if (entry.isDirectory()) {
      const children = await buildFileTree(fullPath, basePath);
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'directory',
        children,
      });
    } else {
      nodes.push({
        name: entry.name,
        path: relativePath,
        type: 'file',
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export async function loadProject(path: string): Promise<{ tree: FileNode[]; path: string }> {
  const absolutePath = resolve(path);
  const stats = await stat(absolutePath);

  if (!stats.isDirectory()) {
    throw new Error('Path is not a directory');
  }

  setRepoPath(absolutePath);
  const tree = await buildFileTree(absolutePath, absolutePath);
  return { tree, path: absolutePath };
}

export async function getTree(): Promise<{ tree: FileNode[] }> {
  const rp = getRepoPath();
  if (!rp) {
    throw new Error('No repository loaded');
  }
  const tree = await buildFileTree(rp, rp);
  return { tree };
}

export async function uploadFolder(
  files: { path: string; content: string }[]
): Promise<{ tree: FileNode[]; path: string }> {
  if (!files || !files.length) {
    throw new Error('No files provided');
  }

  const tempDir = await mkdtemp(join(tmpdir(), 'constrained-'));
  for (const file of files) {
    const filePath = join(tempDir, file.path);
    await mkdir(join(filePath, '..'), { recursive: true });
    await writeFile(filePath, Buffer.from(file.content, 'base64'));
  }

  setRepoPath(tempDir);
  const tree = await buildFileTree(tempDir, tempDir);
  return { tree, path: tempDir };
}
