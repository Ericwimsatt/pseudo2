/**
 * A relationship connects two semantic nodes with a typed edge.
 * Relationships are first-class and inspectable: the Semantic IR
 * panel and Inspector expose them directly.
 */

import type { SemanticNodeId } from "@source-narrator/shared";
import type { RelationshipKind } from "./relationship-kinds.js";

export interface Relationship {
  readonly id: string;
  readonly kind: RelationshipKind;
  readonly from: SemanticNodeId;
  readonly to: SemanticNodeId;
  readonly label?: string;
}

let counter = 0;
export const createRelationship = (
  kind: RelationshipKind,
  from: SemanticNodeId,
  to: SemanticNodeId,
  label?: string,
): Relationship => {
  counter += 1;
  return {
    id: `rel-${counter.toString(36)}`,
    kind,
    from,
    to,
    ...(label !== undefined ? { label } : {}),
  };
};
