/**
 * The Semantic Adapter is the TypeScript-specific half of the
 * translation pipeline. It walks the parsed TypeScript AST and
 * builds a language-independent SemanticGraph using only the
 * semantic node kinds defined by translator-core.
 *
 * The adapter is the ONLY place that knows about TypeScript syntax.
 * Renderers must never import from this file.
 */

import type { FileId } from "@source-narrator/shared";
import { parseTypeScriptSource, type ParseResult } from "../parser/parse-source.js";
import type { SemanticGraph } from "@source-narrator/translator-core/semantic/semantic-graph";
import type { SemanticNode } from "@source-narrator/translator-core/semantic/nodes";
import { createSemanticNode } from "@source-narrator/translator-core/semantic/nodes";
import {
  type AdapterContext,
  type AdaptedStatement,
} from "./helpers.js";
import { dispatchStatement } from "./statement-dispatcher.js";

export const adaptParseResultToSemanticGraph = (fileId: FileId, parse: ParseResult): SemanticGraph => {
  const sourceFile = parse.sourceFile;
  const ctx: AdapterContext = { fileId, idSalt: 1 };

  // The file node carries a synthetic range spanning the entire
  // source file. It exists so the Inspector and Semantic IR
  // panels can show a "file level" node even when the file is
  // empty.
  const sfStart = sourceFile.getStart(sourceFile);
  const sfEnd = sourceFile.getEnd();
  const start = sourceFile.getLineAndCharacterOfPosition(sfStart);
  const end = sourceFile.getLineAndCharacterOfPosition(sfEnd);
  const fileNode = createSemanticNode({
    fileId,
    kind: "file",
    name: parse.filePath,
    text: `File ${parse.filePath}.`,
    source: {
      start: { line: start.line + 1, column: start.character + 1 },
      end: { line: end.line + 1, column: end.character + 1 },
    },
  });

  // Dispatch each top-level statement. The file node is the
  // parent of every top-level node produced.
  const all: SemanticNode[] = [];
  for (const stmt of sourceFile.statements) {
    const adapted: AdaptedStatement = dispatchStatement(ctx, fileNode.id, stmt);
    for (const n of adapted.nodes) all.push(n);
  }

  // Re-parent any orphans to the file node (defensive — adapters
  // should always set parentId explicitly, but this ensures the
  // graph is well-formed even if a future adapter forgets).
  const reparented = all.map((n) => (n.parentId === null ? { ...n, parentId: fileNode.id } : n));

  const fileWithChildren: SemanticNode = { ...fileNode, children: reparented };
  const populated: SemanticGraph = {
    fileId,
    nodes: [fileWithChildren, ...reparented],
    relationships: [],
  };
  return populated;
};

/** Convenience helper to parse + adapt in one call. */
export const parseAndAdapt = (fileId: string, filePath: string, source: string): SemanticGraph => {
  const result = parseTypeScriptSource({ filePath, source });
  if (!result.ok) {
    return { fileId: fileId as FileId, nodes: [], relationships: [] };
  }
  return adaptParseResultToSemanticGraph(fileId as FileId, result.value);
};
