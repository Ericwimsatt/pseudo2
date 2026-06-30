/**
 * The TypeScript LanguageService implements the LanguageService
 * contract from translator-core. The RepositoryController queries
 * it for matches and the TranslationController delegates parsing
 * and semantic conversion to it.
 *
 * The service keeps a per-fileId cache of live TypeScript
 * SourceFile objects so toSemanticGraph can re-walk the AST
 * without re-parsing.
 */

import type { FileId } from "@source-narrator/shared";
import type {
  LanguageService,
  ParseTree,
} from "@source-narrator/translator-core/model";
import { parseTypeScriptSource } from "./parser/parse-source.js";
import { adaptParseResultToSemanticGraph } from "./adapters/semantic-adapter.js";
import type { SemanticGraph } from "@source-narrator/translator-core/semantic/semantic-graph";

const TS_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts"] as const;

export const createTypeScriptLanguageService = (): LanguageService => {
  const cache = new Map<FileId, { path: string; source: string; root: unknown; tsSourceFile: unknown }>();

  return {
    id: "typescript",
    displayName: "TypeScript",
    supportedExtensions: TS_EXTENSIONS,
    matches(path: string): boolean {
      const lower = path.toLowerCase();
      if (lower.endsWith(".d.ts")) return true;
      return TS_EXTENSIONS.some((ext) => lower.endsWith(ext));
    },
    parse(fileId: FileId, path: string, content: string): ParseTree {
      const result = parseTypeScriptSource({ filePath: path, source: content });
      if (!result.ok) {
        const tree: ParseTree = {
          fileId,
          path,
          source: content,
          root: { kind: "Error" },
          diagnostics: [{ message: result.error.message }],
        };
        return tree;
      }
      cache.set(fileId, {
        path,
        source: content,
        root: result.value.root,
        tsSourceFile: result.value.sourceFile,
      });
      return {
        fileId,
        path,
        source: content,
        root: result.value.root,
        diagnostics: result.value.parseDiagnostics.map((d) => ({ message: tsMessage(d) })),
      };
    },
    toSemanticGraph(fileId: FileId, _parseTree: ParseTree, _source: string): SemanticGraph {
      const cached = cache.get(fileId);
      if (!cached) {
        return { fileId, nodes: [], relationships: [] };
      }
      // Re-parse the original source so we have a fresh ParseResult
      // with a live SourceFile. The cache above is intentionally
      // small (one entry per file id) and the parse is cheap.
      const result = parseTypeScriptSource({ filePath: cached.path, source: cached.source });
      if (!result.ok) {
        return { fileId, nodes: [], relationships: [] };
      }
      return adaptParseResultToSemanticGraph(fileId, result.value);
    },
  };
};

const tsMessage = (d: { messageText: unknown }): string => {
  if (typeof d.messageText === "string") return d.messageText;
  if (d.messageText && typeof d.messageText === "object" && "messageText" in d.messageText) {
    return String((d.messageText as { messageText: unknown }).messageText);
  }
  return String(d.messageText);
};
