/**
 * A FileSystem backed by the dev-only HTTP API exposed by the
 * Vite plugin in `vite-plugins/dev-fs.ts`. Used to load a known
 * local path with a single click in the toolbar, without going
 * through the OS file dialog.
 *
 * Production builds do not include this plugin, so the API is
 * unreachable. The DevFileSystem surfaces a clear error if a user
 * somehow tries to use it in production.
 */

import type { FileEntry, FileSystem, FileSystemOptions } from "./filesystem.js";
import { normalizePath } from "@source-narrator/shared";

interface DevFsListResponse {
  readonly root: string;
  readonly path: string;
  readonly entries: readonly FileEntry[];
}

interface DevFsRootResponse {
  readonly name: string;
  readonly path: string;
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

const fetchRoot = async (): Promise<DevFsRootResponse> => {
  const response = await fetch("/api/dev-fs/root");
  if (!response.ok) {
    throw new Error(`Dev file system not available (${response.status}). Did you start the Vite dev server?`);
  }
  return (await response.json()) as DevFsRootResponse;
};

const fetchList = async (relPath: string): Promise<DevFsListResponse> => {
  const url = new URL("/api/dev-fs/list", window.location.origin);
  if (relPath) url.searchParams.set("path", relPath);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Dev file system list failed (${response.status})`);
  }
  return (await response.json()) as DevFsListResponse;
};

const fetchRead = async (relPath: string): Promise<string> => {
  const url = new URL("/api/dev-fs/read", window.location.origin);
  url.searchParams.set("path", relPath);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Dev file system read failed (${response.status}) for ${relPath}`);
  }
  return response.text();
};

export const isDevFileSystemAvailable = async (): Promise<boolean> => {
  try {
    await fetchRoot();
    return true;
  } catch {
    return false;
  }
};

export const createDevFileSystem = async (): Promise<FileSystem> => {
  const root = await fetchRoot();
  return {
    name: `${root.name} (dev)`,
    async list(options: FileSystemOptions = {}) {
      const response = await fetchList("");
      const filtered = response.entries.filter((e) => {
        if (e.kind !== "file") return true;
        if (!shouldInclude(normalizePath(e.path), options)) return false;
        if (options.maxBytes !== undefined && e.size > options.maxBytes) return false;
        return true;
      });
      return filtered;
    },
    async readText(path: string) {
      return fetchRead(path);
    },
  };
};
