/**
 * TypeScript source parser. Wraps the official TypeScript compiler API
 * (ts.createSourceFile) and produces a serializable AST node tree
 * suitable for inspection in the AST panel.
 *
 * The output is intentionally a plain data structure — never a live
 * ts.Node — so it can cross the controller boundary, be inspected in
 * the AST tree view, and survive serialisation.
 */

import ts from "typescript";
import type { Result } from "@source-narrator/shared";
import { ok, err } from "@source-narrator/shared";
import { astIdFromRange, type AstNode } from "./ast-node.js";
import type { AstNodeId } from "@source-narrator/shared";

export interface ParseOptions {
  readonly filePath: string;
  readonly source: string;
  readonly scriptKind?: ts.ScriptKind;
}

export interface ParseResult {
  readonly filePath: string;
  readonly sourceFile: ts.SourceFile;
  readonly root: AstNode;
  readonly nodeCount: number;
  readonly parseDiagnostics: readonly ts.Diagnostic[];
}

const mapPosition = (pos: ts.LineAndCharacter): { line: number; column: number } => ({
  line: pos.line + 1,
  column: pos.character + 1,
});

const mapRange = (node: ts.Node): { start: { line: number; column: number }; end: { line: number; column: number } } => {
  const sf = node.getSourceFile();
  const start = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  const end = sf.getLineAndCharacterOfPosition(node.getEnd());
  return { start: mapPosition(start), end: mapPosition(end) };
};

const truncate = (text: string, max = 120): string =>
  text.length <= max ? text : `${text.slice(0, max - 1)}…`;

const childNodes = (node: ts.Node): ts.Node[] => {
  const out: ts.Node[] = [];
  node.forEachChild((child) => {
    out.push(child);
    return undefined;
  });
  return out;
};

const buildNode = (node: ts.Node, parentId: AstNodeId | null, salt: number): AstNode => {
  const kindName = ts.SyntaxKind[node.kind];
  const range = mapRange(node);
  const id = astIdFromRange(node.kind, range, salt);
  const text = truncate(node.getText());
  const children = childNodes(node);
  return {
    id,
    parentId,
    kind: node.kind,
    kindName,
    range,
    text,
    flags: node.flags,
    children: children.map((c, i) => buildNode(c, id, salt * 31 + i + 1)),
  };
};

const detectScriptKind = (filePath: string): ts.ScriptKind => {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (lower.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) return ts.ScriptKind.JS;
  if (lower.endsWith(".json")) return ts.ScriptKind.JSON;
  return ts.ScriptKind.TS;
};

export const parseTypeScriptSource = (options: ParseOptions): Result<ParseResult> => {
  try {
    const scriptKind = options.scriptKind ?? detectScriptKind(options.filePath);
    const sourceFile = ts.createSourceFile(
      options.filePath,
      options.source,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      scriptKind,
    );

    const root = buildNode(sourceFile, null, 1);
    const nodeCount = countNodes(root);
    const parseDiagnostics: ts.Diagnostic[] = [];

    return ok({
      filePath: options.filePath,
      sourceFile,
      root,
      nodeCount,
      parseDiagnostics,
    });
  } catch (cause) {
    return err(cause instanceof Error ? cause : new Error(String(cause)));
  }
};

const countNodes = (node: AstNode): number =>
  1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
