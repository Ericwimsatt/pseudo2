/**
 * In-memory FileSystem. Useful for tests, demo data, and pre-built
 * sample repositories that the user can load without granting any
 * permissions.
 */

import type { FileEntry, FileSystem, FileSystemOptions } from "./filesystem.js";
import { normalizePath } from "@source-narrator/shared";

export interface InMemoryFile {
  readonly path: string;
  readonly content: string;
}

const shouldInclude = (path: string, opts: FileSystemOptions): boolean => {
  if (opts.include && opts.include.length > 0) {
    if (!opts.include.some((re) => re.test(path))) return false;
  }
  if (opts.exclude && opts.exclude.length > 0) {
    if (opts.exclude.some((re) => re.test(path))) return false;
  }
  return true;
};

const computeDirectories = (paths: readonly string[]): readonly FileEntry[] => {
  const dirs = new Set<string>();
  for (const p of paths) {
    const parts = normalizePath(p).split("/");
    let acc: string | null = null;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const segment = parts[i]!;
      acc = acc ? `${acc}/${segment}` : segment;
      dirs.add(acc);
    }
  }
  return Array.from(dirs).map((d) => ({
    path: d,
    handle: d,
    size: 0,
    lastModified: null,
    kind: "directory" as const,
  }));
};

export const createInMemoryFileSystem = (name: string, files: readonly InMemoryFile[]): FileSystem => {
  const map = new Map<string, string>();
  for (const f of files) map.set(normalizePath(f.path), f.content);

  return {
    name,
    async list(opts: FileSystemOptions = {}) {
      const fileEntries: FileEntry[] = [];
      for (const f of files) {
        if (!shouldInclude(f.path, opts)) continue;
        if (opts.maxBytes !== undefined && f.content.length > opts.maxBytes) continue;
        fileEntries.push({
          path: normalizePath(f.path),
          handle: f.path,
          size: f.content.length,
          lastModified: null,
          kind: "file",
        });
      }
      return [...computeDirectories(fileEntries.map((f) => f.path)), ...fileEntries];
    },
    async readText(path: string) {
      const text = map.get(normalizePath(path));
      if (text === undefined) {
        throw new Error(`No content for path: ${path}`);
      }
      return text;
    },
  };
};
