/**
 * Selection events used to synchronize the UI panels.
 * One selection can point at one of: a source range, an AST node, a
 * semantic node, or an English line. Panels translate between these.
 */

import type { FileId, SemanticNodeId, AstNodeId } from "../types/identifiers.js";
import type { SourceRange } from "../types/ranges.js";

export type SelectionTarget =
  | { readonly kind: "file"; readonly fileId: FileId }
  | {
      readonly kind: "source-range";
      readonly fileId: FileId;
      readonly range: SourceRange;
    }
  | { readonly kind: "ast-node"; readonly fileId: FileId; readonly astNodeId: AstNodeId }
  | {
      readonly kind: "semantic-node";
      readonly fileId: FileId;
      readonly semanticNodeId: SemanticNodeId;
    }
  | { readonly kind: "english-line"; readonly fileId: FileId; readonly lineIndex: number };

export interface SelectionEvent {
  readonly target: SelectionTarget;
  readonly source: string;
  readonly timestamp: number;
}
