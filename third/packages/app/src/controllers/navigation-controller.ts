/**
 * Coordinates which file is currently selected and which entity
 * within that file is highlighted. Sits between the React layer and
 * the rest of the controllers so that selection changes propagate
 * deterministically.
 */

import {
  createLogger,
  TypedEventBus,
  type Logger,
  type SelectionEvent,
  type SelectionTarget,
  type FileId,
  type AstNodeId,
  type SemanticNodeId,
} from "@source-narrator/shared";
import type { AppEventMap } from "./events.js";

export interface NavigationControllerDeps {
  readonly eventBus: TypedEventBus<AppEventMap>;
  readonly logger?: Logger;
}

export interface NavigationController {
  readonly deps: NavigationControllerDeps;
  selectedFileId(): FileId | null;
  selection(): SelectionTarget | null;
  selectFile(fileId: FileId): void;
  selectAstNode(fileId: FileId, nodeId: AstNodeId): void;
  selectSemanticNode(fileId: FileId, nodeId: SemanticNodeId): void;
  selectEnglishLine(fileId: FileId, lineIndex: number): void;
  selectSourceRange(fileId: FileId, range: import("@source-narrator/shared").SourceRange): void;
}

const source = "navigation";

export const createNavigationController = (deps: NavigationControllerDeps): NavigationController => {
  const logger = deps.logger ?? createLogger();
  let fileId: FileId | null = null;
  let target: SelectionTarget | null = null;

  const publish = (): void => {
    if (!target) return;
    const event: SelectionEvent = { target, source, timestamp: Date.now() };
    deps.eventBus.emit("selection:changed", event);
    logger.debug("app", `Selection: ${describe(target)}`);
  };

  return {
    deps,
    selectedFileId: () => fileId,
    selection: () => target,
    selectFile(id) {
      fileId = id;
      target = { kind: "file", fileId: id };
      deps.eventBus.emit("file:selected", { fileId: id });
      publish();
    },
    selectAstNode(id, nodeId) {
      fileId = id;
      target = { kind: "ast-node", fileId: id, astNodeId: nodeId };
      deps.eventBus.emit("ast:node-selected", { fileId: id, nodeId });
      publish();
    },
    selectSemanticNode(id, nodeId) {
      fileId = id;
      target = { kind: "semantic-node", fileId: id, semanticNodeId: nodeId };
      deps.eventBus.emit("semantic:node-selected", { fileId: id, nodeId });
      publish();
    },
    selectEnglishLine(id, lineIndex) {
      fileId = id;
      target = { kind: "english-line", fileId: id, lineIndex };
      deps.eventBus.emit("english:line-selected", { fileId: id, lineIndex });
      publish();
    },
    selectSourceRange(id, range) {
      fileId = id;
      target = { kind: "source-range", fileId: id, range };
      publish();
    },
  };
};

const describe = (t: SelectionTarget): string => {
  switch (t.kind) {
    case "file":
      return `file:${t.fileId}`;
    case "source-range":
      return `source:${t.fileId}@${t.range.start.line}:${t.range.start.column}`;
    case "ast-node":
      return `ast:${t.astNodeId}`;
    case "semantic-node":
      return `semantic:${t.semanticNodeId}`;
    case "english-line":
      return `english:${t.lineIndex}`;
  }
};
