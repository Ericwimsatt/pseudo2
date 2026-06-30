/**
 * The SemanticNode is the language-independent representation of one
 * syntactic entity. Every adapter must produce nodes of this shape;
 * every renderer consumes only this shape.
 *
 * Identity
 *   - id         : stable, unique within a file
 *   - parentId   : structural containment (parent-child)
 *   - references : semantic dependencies (calls, references) — see
 *                  ./relationships
 *
 * Source mapping
 *   - source     : where in the original file this came from
 *
 * Extensibility
 *   - metadata   : a free-form, language-agnostic bag for any extra
 *                  information an adapter wants to expose
 *
 * Renderability
 *   - text       : pre-rendered English for this node
 *   - children   : structural children
 */

import type { SemanticNodeId, SourceRange, FileId } from "@source-narrator/shared";

export type { SemanticNodeKind } from "./node-kinds.js";

export interface SemanticNodeMetadata {
  readonly [key: string]: unknown;
}

export interface SemanticNode {
  readonly id: SemanticNodeId;
  readonly fileId: FileId;
  readonly kind: import("./node-kinds.js").SemanticNodeKind;
  readonly name: string | null;
  readonly text: string;
  readonly source: SourceRange;
  readonly parentId: SemanticNodeId | null;
  readonly children: readonly SemanticNode[];
  readonly references: readonly SemanticNodeId[];
  readonly metadata: SemanticNodeMetadata;
}
