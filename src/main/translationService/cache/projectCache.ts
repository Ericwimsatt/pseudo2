import type { AstCache } from './astCache';
import type { ViewModel } from '../renderable/types';

interface FileCacheEntry {
  astCache: AstCache;
  viewModel: ViewModel;
}

const openCaches = new Map<string, FileCacheEntry>();
let repoPath = '';

export function setCache(path: string, astCache: AstCache, viewModel: ViewModel): void {
  openCaches.set(path, { astCache, viewModel });
}

export function getCache(path: string): FileCacheEntry | undefined {
  return openCaches.get(path);
}

export function clearCache(): void {
  openCaches.clear();
}

export function getRepoPath(): string {
  return repoPath;
}

export function setRepoPath(path: string): void {
  if (repoPath !== path) {
    clearCache();
  }
  repoPath = path;
}
