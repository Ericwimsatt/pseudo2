/**
 * A SourceFile represents a single file's worth of content. The
 * Repository tracks them; the TranslationController processes them.
 *
 * Source files are immutable; transformations are stored alongside
 * the source in caches rather than mutating the file itself.
 */

import type { FileId } from "@source-narrator/shared";

export interface SourceFile {
  readonly id: FileId;
  readonly path: string;
  readonly language: string;
  readonly content: string;
  readonly sizeBytes: number;
  readonly lastModified: number | null;
}
