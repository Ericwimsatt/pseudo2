/**
 * Events emitted and consumed by the controllers. Using a single
 * event map gives a one-stop view of the entire app's public
 * notifications, and lets multiple controllers react without
 * depending on each other.
 */

import type {
  FileId,
  AstNodeId,
  SemanticNodeId,
  SelectionEvent,
} from "@source-narrator/shared";
import type { Repository, EnglishLine, SemanticGraph } from "@source-narrator/translator-core/model";
import type { FileSystem } from "../infrastructure/index.js";

export type AppEventMap = {
  "repository:loading": { name: string };
  "repository:loaded": { repository: Repository };
  "repository:error": { message: string };
  "repository:cleared": Record<string, never>;

  "file:selected": { fileId: FileId };
  "file:parsed": { fileId: FileId; nodeCount: number };
  "file:semantic": { fileId: FileId; graph: SemanticGraph };
  "file:english": { fileId: FileId; lines: readonly EnglishLine[] };

  "selection:changed": SelectionEvent;

  "ast:node-selected": { fileId: FileId; nodeId: AstNodeId };
  "semantic:node-selected": { fileId: FileId; nodeId: SemanticNodeId };
  "english:line-selected": { fileId: FileId; lineIndex: number };
};

// Re-export infrastructure types via the controller event map so that
// callers don't need a second import.
export type { FileSystem };
