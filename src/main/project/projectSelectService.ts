import { homedir } from 'os';
import { join, resolve } from 'path';
import { readdir, stat } from 'fs/promises';
import type { BrowseResult } from '../../shared/api';

export async function browseDirectory(requestedPath?: string): Promise<BrowseResult> {
  const browsePath = requestedPath ? resolve(requestedPath) : homedir();
  const stats = await stat(browsePath);

  if (!stats.isDirectory()) {
    throw new Error('Path is not a directory');
  }

  const entries = await readdir(browsePath, { withFileTypes: true });
  const directories = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => ({
      name: e.name,
      path: join(browsePath, e.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    currentPath: browsePath,
    parentPath: browsePath !== '/' ? join(browsePath, '..') : null,
    directories,
  };
}

export async function openDirectorySelector(): Promise<string | null> {
  const { dialog } = await import('electron');
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
}
