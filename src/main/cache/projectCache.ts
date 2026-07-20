import type { AstCache } from '../../lib/astCache';

const openCaches = new Map<string, AstCache>();
let repoPath = '';

export function getCache(path: string): AstCache | undefined {
  return openCaches.get(path);
}

export function setCache(path: string, cache: AstCache): void {
  openCaches.set(path, cache);
}

export function clearCache(): void {
  openCaches.clear();
}

export function getRepoPath(): string {
  return repoPath;
}

export function setRepoPath(path: string): void {
  repoPath = path;
}
