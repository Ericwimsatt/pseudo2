/**
 * A LanguageService is the language-specific half of the pipeline.
 * Each language implementation exposes a LanguageService so the
 * TranslationController and RepositoryController can remain language
 * agnostic. Adding a new language is a matter of providing a new
 * LanguageService implementation.
 */

import type { FileId, SourceRange } from "@source-narrator/shared";
import type { SemanticGraph } from "../semantic/semantic-graph.js";

export interface ParseTree {
  readonly fileId: FileId;
  /** Original path of the file, included so adapters can re-parse if needed. */
  readonly path: string;
  /** The original source text, included so adapters can re-parse if needed. */
  readonly source: string;
  /** A language-specific handle to the parse result. May be a live AST or plain data. */
  readonly root: unknown;
  readonly diagnostics: readonly { readonly message: string; readonly range?: SourceRange }[];
}

export interface LanguageService {
  readonly id: string;
  readonly displayName: string;
  readonly supportedExtensions: readonly string[];

  /** True if the language can handle the given file path. */
  matches(path: string): boolean;

  /** Produce an AST / parse tree for the file content. */
  parse(fileId: FileId, path: string, content: string): ParseTree;

  /** Convert the parse tree into a SemanticGraph. The original source is provided for context. */
  toSemanticGraph(fileId: FileId, parseTree: ParseTree, source: string): SemanticGraph;
}
