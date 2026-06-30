/**
 * The Repository is the application's model. It owns the file list,
 * the loaded source content, the language services, and caches for
 * derived artefacts (AST, SemanticGraph, English rendering).
 *
 * The Repository is intentionally framework-free. Controllers query
 * it and emit events; React components subscribe to the controllers.
 */

import type {
  FileId,
  RepositoryId,
  SemanticNodeId,
  AstNodeId,
} from "@source-narrator/shared";
import { asRepositoryId } from "@source-narrator/shared";
import type { SourceFile } from "./source-file.js";
import type { LanguageService } from "./language-service.js";
import type { SemanticGraph } from "../semantic/semantic-graph.js";
import type { AstNode } from "@source-narrator/language-typescript/parser";
import { findNode as findAstNode } from "@source-narrator/language-typescript/parser";
import { findNode as findSemanticNode } from "../semantic/semantic-graph.js";
import type { EnglishLine } from "../renderers/english/english-line.js";

export interface RepositoryMetadata {
  readonly name: string;
  readonly rootPath: string;
  readonly fileCount: number;
  readonly loadedAt: number;
  readonly detectedLanguages: readonly string[];
}

export interface ParseTreeWithMeta {
  readonly tree: unknown;
  readonly languageId: string;
  readonly diagnostics: readonly { readonly message: string }[];
  readonly astRoot?: AstNode;
  readonly astNodeCount?: number;
}

export type { EnglishLine };

export interface Repository {
  readonly id: RepositoryId;
  readonly metadata: RepositoryMetadata;
  readonly languageServices: readonly LanguageService[];

  files(): readonly SourceFile[];
  fileById(id: FileId): SourceFile | null;
  fileByPath(path: string): SourceFile | null;

  putParseTree(fileId: FileId, tree: ParseTreeWithMeta): void;
  getParseTree(fileId: FileId): ParseTreeWithMeta | null;
  putSemanticGraph(fileId: FileId, graph: SemanticGraph): void;
  getSemanticGraph(fileId: FileId): SemanticGraph | null;
  putEnglish(fileId: FileId, lines: readonly EnglishLine[]): void;
  getEnglish(fileId: FileId): readonly EnglishLine[];

  astNodeOf(fileId: FileId, id: AstNodeId): AstNode | null;
  semanticNodeOf(fileId: FileId, id: SemanticNodeId): import("../semantic/nodes/semantic-node.js").SemanticNode | null;
}

let repositoryCounter = 0;
export const createRepository = (params: {
  name: string;
  rootPath: string;
  files: readonly SourceFile[];
  languageServices: readonly LanguageService[];
}): Repository => {
  repositoryCounter += 1;
  const id = asRepositoryId(`repo-${repositoryCounter.toString(36)}`);

  const detectedLanguages = Array.from(
    new Set(
      params.files
        .map((f) => params.languageServices.find((s) => s.matches(f.path))?.id)
        .filter((x): x is string => typeof x === "string"),
    ),
  );

  const files = new Map<FileId, SourceFile>();
  const parseCache = new Map<FileId, ParseTreeWithMeta>();
  const semanticCache = new Map<FileId, SemanticGraph>();
  const englishCache = new Map<FileId, readonly EnglishLine[]>();
  const pathIndex = new Map<string, SourceFile>();

  for (const f of params.files) {
    files.set(f.id, f);
    pathIndex.set(f.path, f);
  }

  const metadata: RepositoryMetadata = {
    name: params.name,
    rootPath: params.rootPath,
    fileCount: params.files.length,
    loadedAt: Date.now(),
    detectedLanguages,
  };

  return {
    id,
    metadata,
    languageServices: params.languageServices,
    files: () => Array.from(files.values()),
    fileById: (fid) => files.get(fid) ?? null,
    fileByPath: (p) => pathIndex.get(p) ?? null,
    putParseTree: (fid, t) => {
      parseCache.set(fid, t);
    },
    getParseTree: (fid) => parseCache.get(fid) ?? null,
    putSemanticGraph: (fid, g) => {
      semanticCache.set(fid, g);
    },
    getSemanticGraph: (fid) => semanticCache.get(fid) ?? null,
    putEnglish: (fid, lines) => {
      englishCache.set(fid, lines);
    },
    getEnglish: (fid) => englishCache.get(fid) ?? [],
    astNodeOf: (fid, nid) => {
      const t = parseCache.get(fid);
      if (!t?.astRoot) return null;
      return findAstNode(t.astRoot, nid);
    },
    semanticNodeOf: (fid, sid) => {
      const g = semanticCache.get(fid);
      if (!g) return null;
      return findSemanticNode(g, sid);
    },
  };
};
