/**
 * The RepositoryLoader reads a FileSystem and produces a
 * translator-core Repository. It is the bridge between the
 * Infrastructure and Domain layers.
 *
 *   FileSystem  →  loadRepository(fs)  →  Repository
 *
 * The loader is synchronous-friendly: callers typically await
 * `readText` for every file. The loader also surfaces
 * diagnostics instead of throwing.
 */

import {
  type SourceFile,
  type Repository,
  createRepository,
  type LanguageService,
} from "@source-narrator/translator-core/model";
import type { FileSystem } from "./filesystem.js";
import {
  asFileId,
  basename,
  createLogger,
  extname,
  normalizePath,
  type FileId,
  type Logger,
} from "@source-narrator/shared";

export interface LoadProgress {
  readonly total: number;
  readonly processed: number;
  readonly currentPath: string | null;
}

export interface LoadResult {
  readonly repository: Repository;
  readonly files: readonly SourceFile[];
  readonly skipped: readonly { path: string; reason: string }[];
}

export interface LoadOptions {
  readonly logger?: Logger;
  readonly onProgress?: (progress: LoadProgress) => void;
  /** Maximum file size to read; larger files are skipped. */
  readonly maxBytes?: number;
}

const isProbablyBinary = (path: string, content: string): boolean => {
  const ext = extname(path).toLowerCase();
  const binaryExts = new Set([
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico",
    ".pdf", ".zip", ".tar", ".gz", ".tgz", ".7z",
    ".mp3", ".mp4", ".mov", ".wav", ".ogg",
    ".ttf", ".otf", ".woff", ".woff2",
  ]);
  if (binaryExts.has(ext)) return true;
  // Heuristic: NUL byte in the first 8KB
  const probe = content.slice(0, 8192);
  return probe.includes("\u0000");
};

const detectLanguage = (path: string, services: readonly LanguageService[]): string => {
  for (const s of services) {
    if (s.matches(path)) return s.id;
  }
  return "plain";
};

export const loadRepository = async (
  fs: FileSystem,
  languageServices: readonly LanguageService[],
  options: LoadOptions = {},
): Promise<LoadResult> => {
  const logger = options.logger ?? createLogger();
  const start = performance.now();
  logger.info("app", "Repository loading started", { name: fs.name });

  const entries = await fs.list();
  const fileEntries = entries.filter((e) => e.kind === "file");
  const total = fileEntries.length;
  const sources: SourceFile[] = [];
  const skipped: { path: string; reason: string }[] = [];

  let processed = 0;
  for (const entry of fileEntries) {
    options.onProgress?.({ total, processed, currentPath: entry.path });
    let content: string;
    try {
      content = await fs.readText(entry.path);
    } catch (cause) {
      skipped.push({ path: entry.path, reason: cause instanceof Error ? cause.message : String(cause) });
      logger.warn("filesystem", `Skipping unreadable file: ${entry.path}`, {
        reason: cause instanceof Error ? cause.message : String(cause),
      });
      processed += 1;
      continue;
    }
    if (isProbablyBinary(entry.path, content)) {
      skipped.push({ path: entry.path, reason: "binary" });
      logger.debug("filesystem", `Skipping binary file: ${entry.path}`);
      processed += 1;
      continue;
    }
    const id = asFileId(`f-${stableHash(entry.path)}`);
    const sf: SourceFile = {
      id,
      path: normalizePath(entry.path),
      language: detectLanguage(entry.path, languageServices),
      content,
      sizeBytes: content.length,
      lastModified: entry.lastModified,
    };
    sources.push(sf);
    processed += 1;
    options.onProgress?.({ total, processed, currentPath: entry.path });
  }

  const repository = createRepository({
    name: fs.name,
    rootPath: "/",
    files: sources,
    languageServices,
  });

  const duration = performance.now() - start;
  logger.info("app", "Repository loaded", {
    name: fs.name,
    files: sources.length,
    skipped: skipped.length,
    languages: repository.metadata.detectedLanguages,
    durationMs: Math.round(duration),
  });

  return { repository, files: sources, skipped };
};

const stableHash = (input: string): string => {
  // Small FNV-1a hash for stable file ids.
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
};

export const findFileByPath = (repo: Repository, path: string): FileId | null => {
  const f = repo.fileByPath(path);
  return f ? f.id : null;
};

export { basename };
