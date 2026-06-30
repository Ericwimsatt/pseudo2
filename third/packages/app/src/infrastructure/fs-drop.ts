/**
 * A FileSystem built from a DataTransfer (drag-and-drop) or
 * <input type="file" webkitdirectory> payload. Uses
 * FileSystemEntry / FileSystemFileEntry where available, with a
 * fallback to `webkitGetAsEntry` on the DataTransferItem API.
 *
 * The drag-and-drop FileSystem keeps file contents in memory; it
 * does not need to call the API for readText, since the file
 * objects are already available when the user drops them.
 */

import type { FileEntry, FileSystem, FileSystemOptions } from "./filesystem.js";
import { normalizePath } from "@source-narrator/shared";

interface DTE {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
}

interface DTF extends DTE {
  isFile: true;
  file(success: (file: File) => void, error?: (e: Error) => void): void;
}

interface DTReader {
  readonly entries: DTE[];
  fullPath: string;
}

interface DataTransferItemLike {
  readonly kind: string;
  webkitGetAsEntry?: () => DTE | null;
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

const collectDirectory = async (
  reader: DTReader,
  prefix: string,
  opts: FileSystemOptions,
  acc: FileEntry[],
  files: Map<string, File>,
): Promise<void> => {
  for (const entry of reader.entries) {
    const baseName = entry.name;
    const path = prefix ? `${prefix}/${baseName}` : baseName;
    if (entry.isFile) {
      const fileEntry = entry as DTF;
      if (!shouldInclude(normalizePath(path), opts)) continue;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file((f) => resolve(f), (e) => reject(e));
      });
      if (opts.maxBytes !== undefined && file.size > opts.maxBytes) continue;
      acc.push({
        path: normalizePath(path),
        handle: path,
        size: file.size,
        lastModified: file.lastModified,
        kind: "file",
      });
      files.set(normalizePath(path), file);
    } else if (entry.isDirectory) {
      const dirEntry = entry as unknown as DTReader;
      acc.push({
        path: normalizePath(path),
        handle: path,
        size: 0,
        lastModified: null,
        kind: "directory",
      });
      await collectDirectory(dirEntry, path, opts, acc, files);
    }
  }
};

export const fsFromDataTransferItems = async (
  items: readonly DataTransferItemLike[],
  opts: FileSystemOptions = {},
): Promise<FileSystem> => {
  const entries: FileEntry[] = [];
  const files = new Map<string, File>();
  for (const item of items) {
    if (item.kind !== "file") continue;
    const entry = item.webkitGetAsEntry?.();
    if (!entry) continue;
    if (entry.isFile) {
      const fileEntry = entry as DTF;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file((f) => resolve(f), (e) => reject(e));
      });
      const path = entry.fullPath.replace(/^\//, "");
      if (shouldInclude(normalizePath(path), opts) && (opts.maxBytes === undefined || file.size <= opts.maxBytes)) {
        entries.push({
          path: normalizePath(path),
          handle: path,
          size: file.size,
          lastModified: file.lastModified,
          kind: "file",
        });
        files.set(normalizePath(path), file);
      }
    } else if (entry.isDirectory) {
      const dirEntry = entry as unknown as DTReader;
      const basePath = entry.fullPath.replace(/^\//, "");
      entries.push({
        path: normalizePath(basePath),
        handle: entry.fullPath,
        size: 0,
        lastModified: null,
        kind: "directory",
      });
      await collectDirectory(dirEntry, basePath, opts, entries, files);
    }
  }

  return {
    name: "Dropped folder",
    async list() {
      return entries;
    },
    async readText(path: string) {
      const file = files.get(normalizePath(path));
      if (!file) throw new Error(`No file at: ${path}`);
      return file.text();
    },
  };
};
