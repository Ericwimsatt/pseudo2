/**
 * EnglishLine is the single renderable unit produced by the
 * English renderer. Both the model's repository cache and the
 * renderer's own definitions refer to the same shape.
 *
 * The type is intentionally language-agnostic. Renderers are free
 * to populate every field or leave some empty; consumers must
 * tolerate both.
 *
 * `sourceRange` is the union of the source ranges of the semantic
 * nodes that produced this line. It is the cheapest way to map an
 * English line back to a location in the original file.
 */

import type { SemanticNodeId, AstNodeId, SourceRange } from "@source-narrator/shared";

export interface EnglishLine {
  readonly lineIndex: number;
  readonly text: string;
  readonly semanticNodeIds: readonly SemanticNodeId[];
  readonly astNodeIds: readonly AstNodeId[];
  readonly indentation: number;
  readonly paragraphId?: string;
  readonly sourceRange?: SourceRange;
}
