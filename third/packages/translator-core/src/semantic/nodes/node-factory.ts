/**
 * Factory for building SemanticNodes. Encapsulates id generation and
 * makes adapter code easier to read by providing a single constructor
 * for the common case.
 */

import {
  asFileId,
  asSemanticNodeId,
  type FileId,
  type SemanticNodeId,
  type SourceRange,
} from "@source-narrator/shared";
import type { SemanticNode, SemanticNodeMetadata } from "./semantic-node.js";
import type { SemanticNodeKind } from "./node-kinds.js";

export interface CreateNodeInput {
  readonly id?: SemanticNodeId;
  readonly fileId: FileId;
  readonly kind: SemanticNodeKind;
  readonly name?: string | null;
  readonly text: string;
  readonly source: SourceRange;
  readonly parentId?: SemanticNodeId | null;
  readonly children?: readonly SemanticNode[];
  readonly references?: readonly SemanticNodeId[];
  readonly metadata?: SemanticNodeMetadata;
}

let counter = 0;
const nextAutoId = (fileId: FileId, kind: SemanticNodeKind): SemanticNodeId => {
  counter += 1;
  return asSemanticNodeId(`${fileId}::${kind}::${counter.toString(36)}`);
};

export const createSemanticNode = (input: CreateNodeInput): SemanticNode => {
  const id = input.id ?? nextAutoId(input.fileId, input.kind);
  return {
    id,
    fileId: input.fileId,
    kind: input.kind,
    name: input.name ?? null,
    text: input.text,
    source: input.source,
    parentId: input.parentId ?? null,
    children: input.children ?? [],
    references: input.references ?? [],
    metadata: input.metadata ?? {},
  };
};

/**
 * Convenience helper for adapters that already have a file id but
 * receive the raw string from the controller. Exposed for tests.
 */
export const createFileScopedNode = (
  fileIdRaw: string,
  kind: SemanticNodeKind,
  text: string,
  source: SourceRange,
  extra: Partial<CreateNodeInput> = {},
): SemanticNode =>
  createSemanticNode({
    fileId: asFileId(fileIdRaw),
    kind,
    text,
    source,
    ...extra,
  });
