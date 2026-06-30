/**
 * Path utilities. We support both POSIX-style paths (web context) and
 * the underlying host's separator. The repository loader normalises
 * everything to forward slashes.
 */

export const normalizePath = (raw: string): string => {
  if (!raw) return "";
  const replaced = raw.replace(/\\/g, "/");
  const parts: string[] = [];
  for (const segment of replaced.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  const leadingSlash = replaced.startsWith("/") ? "/" : "";
  return leadingSlash + parts.join("/");
};

export const joinPath = (...segments: readonly string[]): string => {
  const filtered = segments.filter((s) => s && s.length > 0);
  if (filtered.length === 0) return "";
  return normalizePath(filtered.join("/"));
};

export const dirname = (p: string): string => {
  const norm = normalizePath(p);
  const idx = norm.lastIndexOf("/");
  if (idx === -1) return "";
  return norm.slice(0, idx);
};

export const basename = (p: string): string => {
  const norm = normalizePath(p);
  const idx = norm.lastIndexOf("/");
  return idx === -1 ? norm : norm.slice(idx + 1);
};

export const extname = (p: string): string => {
  const base = basename(p);
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot);
};

export const isAbsolute = (p: string): boolean => p.startsWith("/") || /^[A-Za-z]:[\\/]/.test(p);

export const pathSegments = (p: string): readonly string[] => normalizePath(p).split("/").filter(Boolean);
