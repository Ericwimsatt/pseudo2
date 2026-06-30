/**
 * Vite dev plugin: exposes a tiny HTTP API for reading files from
 * a local directory. The intent is to let the dev-only "Open dev
 * repo" button populate a repository without requiring the user
 * to navigate the OS file dialog.
 *
 * This plugin is dev-only; the production build does not include
 * it and the API is never reachable.
 *
 * Configuration
 *   - VITE_DEV_FS_ROOT environment variable sets the root path
 *     served by the API. If unset, defaults to
 *     /Users/ericwimsatt/git/stemwise.
 *
 * Endpoints
 *   GET /api/dev-fs/root            -> JSON { name, path }
 *   GET /api/dev-fs/list?path=...   -> JSON of file entries
 *   GET /api/dev-fs/read?path=...   -> text/plain contents
 *
 * Security: this dev server is intended to be used on a trusted
 * machine. The plugin only serves files inside the configured
 * root, and the root must be set explicitly.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";

const DEFAULT_ROOT = "/Users/ericwimsatt/git/stemwise";

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "coverage",
  ".cache",
  ".vite",
  ".claude",
  ".fallow",
  ".lovable",
]);

const EXCLUDE_FILES = new Set([
  "bun.lock",
  "bun.lockb",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".DS_Store",
]);

const TEXT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".md", ".mdx", ".txt", ".css", ".scss", ".less",
  ".html", ".htm", ".xml", ".yml", ".yaml", ".toml", ".ini",
  ".env", ".gitignore", ".eslintrc", ".prettierrc",
  ".svg", ".vue", ".svelte", ".astro", ".graphql", ".gql",
]);

const MAX_FILE_BYTES = 4 * 1024 * 1024;

const isProbablyBinary = (buffer: Buffer, fileExt: string): boolean => {
  if (fileExt === ".png" || fileExt === ".jpg" || fileExt === ".jpeg" || fileExt === ".gif" || fileExt === ".webp" ||
      fileExt === ".ico" || fileExt === ".pdf" || fileExt === ".zip" || fileExt === ".tar" || fileExt === ".gz" ||
      fileExt === ".woff" || fileExt === ".woff2" || fileExt === ".ttf" || fileExt === ".otf" || fileExt === ".mp4" ||
      fileExt === ".mp3" || fileExt === ".mov") {
    return true;
  }
  const probe = buffer.subarray(0, Math.min(8192, buffer.length));
  for (let i = 0; i < probe.length; i += 1) {
    if (probe[i] === 0) return true;
  }
  return false;
};

const fileExt = (p: string): string => {
  const dot = p.lastIndexOf(".");
  return dot === -1 ? "" : p.slice(dot).toLowerCase();
};

const safeJoin = (root: string, requested: string): string => {
  const normalised = path.normalize(decodeURIComponent(requested));
  const joined = path.resolve(root, normalised);
  if (joined !== root && !joined.startsWith(root + path.sep)) {
    throw new Error("Path escapes root");
  }
  return joined;
};

const listEntries = async (root: string, relPath: string) => {
  const abs = safeJoin(root, relPath);
  const entries = await fs.readdir(abs, { withFileTypes: true });
  const out: Array<{
    path: string;
    handle: string;
    size: number;
    lastModified: number | null;
    kind: "file" | "directory";
  }> = [];
  for (const e of entries) {
    if (EXCLUDE_DIRS.has(e.name) || EXCLUDE_FILES.has(e.name)) continue;
    const entryRel = relPath ? `${relPath}/${e.name}` : e.name;
    if (e.isDirectory()) {
      out.push({ path: entryRel, handle: entryRel, size: 0, lastModified: null, kind: "directory" });
    } else if (e.isFile()) {
      const stat = await fs.stat(path.join(abs, e.name));
      if (stat.size > MAX_FILE_BYTES) continue;
      out.push({ path: entryRel, handle: entryRel, size: stat.size, lastModified: stat.mtimeMs, kind: "file" });
    }
  }
  out.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "directory" ? -1 : 1;
    return a.path.localeCompare(b.path);
  });
  return out;
};

export const devFileSystemPlugin = (): Plugin => {
  const rootFromEnv = process.env.VITE_DEV_FS_ROOT ?? DEFAULT_ROOT;
  let root = rootFromEnv;
  let rootName = path.basename(root);

  return {
    name: "source-narrator:dev-fs",
    apply: "serve",
    async configureServer(server) {
      try {
        const stat = await fs.stat(root);
        if (!stat.isDirectory()) throw new Error("not a directory");
      } catch (cause) {
        server.config.logger.warn(
          `[dev-fs] configured root not accessible: ${root} (${cause instanceof Error ? cause.message : String(cause)})`,
        );
      }

      server.middlewares.use("/api/dev-fs", async (req, res) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const action = url.pathname.replace(/^\/+/, "");
        try {
          if (action === "root") {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ name: rootName, path: root }));
            return;
          }
          if (action === "list") {
            const sub = url.searchParams.get("path") ?? "";
            const entries = await listEntries(root, sub);
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ root, path: sub, entries }));
            return;
          }
          if (action === "read") {
            const sub = url.searchParams.get("path") ?? "";
            const abs = safeJoin(root, sub);
            const buffer = await fs.readFile(abs);
            if (isProbablyBinary(buffer, fileExt(sub))) {
              res.statusCode = 415;
              res.end("binary file");
              return;
            }
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
            res.end(buffer.toString("utf-8"));
            return;
          }
          res.statusCode = 404;
          res.end("not found");
        } catch (cause) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: cause instanceof Error ? cause.message : String(cause) }));
        }
      });
    },
  };
};
