/**
 * Diagnostic primitives. Diagnostics are produced at every pipeline stage
 * (loading, parsing, semantic conversion, rendering) and surfaced in the
 * Diagnostics panel. They are intentionally language-agnostic.
 */

import type { SourceRange } from "./ranges.js";

export type DiagnosticSeverity = "info" | "warning" | "error";

export type DiagnosticStage =
  | "filesystem"
  | "parser"
  | "semantic"
  | "renderer"
  | "application";

export interface Diagnostic {
  readonly id: string;
  readonly stage: DiagnosticStage;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
  readonly source?: string;
  readonly range?: SourceRange;
  readonly code?: string;
  readonly timestamp: number;
}

export interface DiagnosticBag {
  readonly entries: readonly Diagnostic[];
  add(diagnostic: Diagnostic): void;
  clear(): void;
  byStage(stage: DiagnosticStage): readonly Diagnostic[];
  toArray(): readonly Diagnostic[];
}
