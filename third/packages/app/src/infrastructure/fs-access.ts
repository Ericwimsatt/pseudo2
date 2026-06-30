/**
 * A FileSystem backed by the browser's File System Access API.
 * Use `openDirectory()` to obtain an instance; this module does
 * not auto-prompt.
 */

import type { FileEntry, FileSystem, FileSystemOptions } from "./filesystem.js";
import { normalizePath } from "@source-narrator/shared";
// FileEntry is re-exported below for consumers that prefer the
// dedicated name.

interface FileSystemFileHandle {
  readonly kind: "file";
  readonly name: string;
  getFile(): Promise<File>;
}

interface FileSystemDirectoryHandle {
  readonly kind: "directory";
  readonly name: string;
  getDirectoryHandle(name: string): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string): Promise<FileSystemFileHandle>;
  values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
}

interface WindowWithFS extends Window {
  showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
}

const hasFSApi = (): boolean =>
  typeof window !== "undefined" && typeof (window as WindowWithFS).showDirectoryPicker === "function";

export const isDirectoryPickerSupported = (): boolean => hasFSApi();

const shouldInclude = (path: string, opts: FileSystemOptions): boolean => {
  if (opts.include && opts.include.length > 0) {
    if (!opts.include.some((re) => re.test(path))) return false;
  }
  if (opts.exclude && opts.exclude.length > 0) {
    if (opts.exclude.some((re) => re.test(path))) return false;
  }
  return true;
};

const collectEntries = async (
  handle: FileSystemDirectoryHandle,
  prefix: string,
  opts: FileSystemOptions,
  acc: FileEntry[],
): Promise<void> => {
  for await (const child of handle.values()) {
    const childPath = prefix ? `${prefix}/${child.name}` : child.name;
    if (child.kind === "directory") {
      acc.push({ path: normalizePath(childPath), handle: childPath, size: 0, lastModified: null, kind: "directory" });
      await collectEntries(child, childPath, opts, acc);
    } else {
      if (!shouldInclude(normalizePath(childPath), opts)) continue;
      const file = await child.getFile();
      if (opts.maxBytes !== undefined && file.size > opts.maxBytes) continue;
      acc.push({
        path: normalizePath(childPath),
        handle: childPath,
        size: file.size,
        lastModified: file.lastModified,
        kind: "file",
      });
    }
  }
};

export interface FSAccessFileSystem extends FileSystem {
  readonly root: FileSystemDirectoryHandle;
}

export const openDirectory = async (opts: FileSystemOptions = {}): Promise<FSAccessFileSystem | null> => {
  if (!hasFSApi()) return null;
  const root = await (window as WindowWithFS).showDirectoryPicker!({ mode: "read" });
  const fs: FSAccessFileSystem = {
    name: root.name,
    root,
    async list() {
      const fresh: FileEntry[] = [];
      await collectEntries(root, "", opts, fresh);
      return fresh;
    },
    async readText(path: string) {
      return readFileFromRoot(root, path);
    },
  };
  return fs;
};

const readFileFromRoot = async (root: FileSystemDirectoryHandle, path: string): Promise<string> => {
  const parts = normalizePath(path).split("/").filter(Boolean);
  let dir: FileSystemDirectoryHandle = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    dir = await dir.getDirectoryHandle(parts[i]!);
  }
  const fileHandle = await dir.getFileHandle(parts[parts.length - 1]!);
  const file = await fileHandle.getFile();
  return file.text();
};
