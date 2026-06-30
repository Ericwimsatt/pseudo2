/**
 * The Inspector Controller resolves a current selection into the
 * information the Inspector panel needs to display. It is read-only
 * with respect to the rest of the system; it just queries the
 * Repository and the NavigationController.
 *
 * The "describe" functions below keep all entity-shape knowledge
 * in one place; the panel itself remains a dumb presenter.
 */

import {
  createLogger,
  TypedEventBus,
  type Logger,
  type FileId,
  type AstNodeId,
  type SemanticNodeId,
} from "@source-narrator/shared";
import type { Repository, EnglishLine } from "@source-narrator/translator-core/model";
import type { AppEventMap } from "./events.js";
import type { NavigationController } from "./navigation-controller.js";
import type { RepositoryController } from "./repository-controller.js";

export interface InspectorViewModel {
  readonly title: string;
  readonly subtitle: string;
  readonly sourceRange: import("@source-narrator/shared").SourceRange | null;
  readonly kind: string;
  readonly language: string;
  readonly fields: ReadonlyArray<{ readonly key: string; readonly value: string }>;
  readonly children: readonly InspectorViewModel[];
  readonly parent: InspectorViewModel | null;
  readonly relationships: ReadonlyArray<{ readonly kind: string; readonly direction: "out" | "in"; readonly label: string }>;
}

export interface InspectorControllerDeps {
  readonly eventBus: TypedEventBus<AppEventMap>;
  readonly repository: RepositoryController;
  readonly navigation: NavigationController;
  readonly logger?: Logger;
}

export interface InspectorController {
  readonly deps: InspectorControllerDeps;
  viewModel(): InspectorViewModel | null;
  englishLine(index: number): EnglishLine | null;
}

const noopLogger = (): Logger | undefined => undefined;

export const createInspectorController = (deps: InspectorControllerDeps): InspectorController => {
  const logger = deps.logger ?? noopLogger() ?? createLogger();
  const repoFor = (): Repository | null => deps.repository.current();

  const viewModel = (): InspectorViewModel | null => {
    const repo = repoFor();
    if (!repo) return null;
    const selection = deps.navigation.selection();
    if (!selection) return null;
    switch (selection.kind) {
      case "file":
        return describeFile(repo, selection.fileId);
      case "ast-node":
        return describeAstNode(repo, selection.fileId, selection.astNodeId);
      case "semantic-node":
        return describeSemanticNode(repo, selection.fileId, selection.semanticNodeId);
      case "english-line":
        return describeEnglishLine(repo, selection.fileId, selection.lineIndex);
      case "source-range":
        return describeSourceRange(repo, selection.fileId, selection.range);
    }
  };

  const englishLine = (index: number): EnglishLine | null => {
    const repo = repoFor();
    if (!repo) return null;
    const sel = deps.navigation.selection();
    const fileId = sel?.fileId ?? deps.navigation.selectedFileId();
    if (!fileId) return null;
    const lines = repo.getEnglish(fileId);
    return lines[index] ?? null;
  };

  return {
    deps,
    viewModel,
    englishLine,
  };

  function describeFile(repo: Repository, fileId: FileId): InspectorViewModel {
    const f = repo.fileById(fileId);
    if (!f) return empty("File", fileId);
    return {
      title: f.path,
      subtitle: `${f.sizeBytes} bytes · ${f.language}`,
      sourceRange: null,
      kind: "File",
      language: f.language,
      fields: [
        { key: "Path", value: f.path },
        { key: "Size", value: `${f.sizeBytes}` },
        { key: "Last modified", value: f.lastModified ? new Date(f.lastModified).toISOString() : "—" },
        { key: "Language", value: f.language },
      ],
      children: [],
      parent: null,
      relationships: [],
    };
  }

  function describeAstNode(repo: Repository, fileId: FileId, nodeId: AstNodeId): InspectorViewModel {
    const node = repo.astNodeOf(fileId, nodeId);
    if (!node) return empty("AST Node", nodeId);
    const parent = node.parentId ? repo.astNodeOf(fileId, node.parentId) : null;
    return {
      title: `${node.kindName}${node.text ? `: ${truncate(node.text)}` : ""}`,
      subtitle: `Line ${node.range.start.line}–${node.range.end.line}`,
      sourceRange: node.range,
      kind: node.kindName,
      language: "TypeScript AST",
      fields: [
        { key: "Kind", value: node.kindName },
        { key: "Range", value: `${node.range.start.line}:${node.range.start.column} – ${node.range.end.line}:${node.range.end.column}` },
        { key: "Text", value: truncate(node.text) },
        { key: "Flags", value: String(node.flags) },
      ],
      children: node.children.slice(0, 50).map((c) => describeAstNode(repo, fileId, c.id)),
      parent: parent ? describeAstNode(repo, fileId, parent.id) : null,
      relationships: [],
    };
  }

  function describeSemanticNode(repo: Repository, fileId: FileId, nodeId: SemanticNodeId): InspectorViewModel {
    const node = repo.semanticNodeOf(fileId, nodeId);
    if (!node) return empty("Semantic Node", nodeId);
    const parent = node.parentId ? repo.semanticNodeOf(fileId, node.parentId) : null;
    const graph = repo.getSemanticGraph(fileId);
    const rels = graph ? graph.relationships.filter((r) => r.from === node.id || r.to === node.id) : [];
    return {
      title: node.name ? `${node.kind} ${node.name}` : node.kind,
      subtitle: node.text,
      sourceRange: node.source,
      kind: node.kind,
      language: "Semantic IR",
      fields: [
        { key: "Kind", value: node.kind },
        { key: "Name", value: node.name ?? "—" },
        { key: "Text", value: truncate(node.text) },
        { key: "Source", value: `${node.source.start.line}:${node.source.start.column} – ${node.source.end.line}:${node.source.end.column}` },
        { key: "References", value: String(node.references.length) },
      ],
      children: node.children.slice(0, 50).map((c) => describeSemanticNode(repo, fileId, c.id)),
      parent: parent ? describeSemanticNode(repo, fileId, parent.id) : null,
      relationships: rels.map((r) => ({
        kind: r.kind,
        direction: r.from === node.id ? "out" : "in",
        label: r.label ?? (r.from === node.id ? r.to : r.from),
      })),
    };
  }

  function describeEnglishLine(repo: Repository, fileId: FileId, lineIndex: number): InspectorViewModel {
    const lines = repo.getEnglish(fileId);
    const line = lines[lineIndex];
    if (!line) return empty("English Line", lineIndex);
    return {
      title: `Line ${lineIndex + 1}`,
      subtitle: line.text,
      sourceRange: null,
      kind: "EnglishLine",
      language: "English",
      fields: [
        { key: "Index", value: String(lineIndex) },
        { key: "Indentation", value: String(line.indentation ?? 0) },
        { key: "Semantic nodes", value: String(line.semanticNodeIds.length) },
        { key: "AST nodes", value: String(line.astNodeIds.length) },
      ],
      children: [],
      parent: null,
      relationships: [],
    };
  }

  function describeSourceRange(
    repo: Repository,
    fileId: FileId,
    range: import("@source-narrator/shared").SourceRange,
  ): InspectorViewModel {
    const f = repo.fileById(fileId);
    const text = f ? excerpt(f.content, range) : "";
    return {
      title: `Source ${range.start.line}:${range.start.column}`,
      subtitle: text,
      sourceRange: range,
      kind: "SourceRange",
      language: f?.language ?? "text",
      fields: [
        { key: "Start", value: `${range.start.line}:${range.start.column}` },
        { key: "End", value: `${range.end.line}:${range.end.column}` },
        { key: "Excerpt", value: truncate(text) },
      ],
      children: [],
      parent: null,
      relationships: [],
    };
  }

  function empty(label: string, id: string | number): InspectorViewModel {
    return {
      title: label,
      subtitle: String(id),
      sourceRange: null,
      kind: label,
      language: "",
      fields: [],
      children: [],
      parent: null,
      relationships: [],
    };
  }
};

const truncate = (s: string, max = 200): string => (s.length <= max ? s : `${s.slice(0, max)}…`);

const excerpt = (content: string, range: import("@source-narrator/shared").SourceRange): string => {
  const lines = content.split("\n");
  const startLine = Math.max(0, range.start.line - 1);
  const endLine = Math.min(lines.length, range.end.line);
  return lines.slice(startLine, endLine).join("\n");
};
