/**
 * A tiny abstraction over the host file system. The browser exposes
 * very different APIs for picking directories, dropping folders, and
 * loading <input type="file"> trees. The FileSystem interface gives
 * the rest of the application a single, uniform way to list and
 * read files.
 *
 * The current implementation supports:
 *  - showDirectoryPicker (Chromium) via WindowWithFS
 *  - drag-and-drop folders
 *  - recursive <input type=file webkitdirectory>
 *  - in-memory zip-like maps for tests
 */

export interface FileEntry {
  /** Path relative to the repository root, using forward slashes. */
  readonly path: string;
  /** Absolute path or, in the browser, the relative path. */
  readonly handle: string;
  readonly size: number;
  readonly lastModified: number | null;
  readonly kind: "file" | "directory";
}

export interface FileSystem {
  /** Human-readable name for the source of files. */
  readonly name: string;
  list(options?: FileSystemOptions): Promise<readonly FileEntry[]>;
  readText(path: string): Promise<string>;
}

export interface FileSystemOptions {
  readonly include?: readonly RegExp[];
  readonly exclude?: readonly RegExp[];
  readonly maxBytes?: number;
}
