/**
 * Caches for derived artefacts. Currently a thin pass-through that
 * uses the Repository's built-in caches. This file exists so we have
 * a place to add eviction, persistence, and instrumentation later
 * without touching the controllers.
 */

import type { FileId } from "@source-narrator/shared";
import type { Repository, SemanticGraph } from "@source-narrator/translator-core/model";

export const getOrComputeSemantic = async (
  repo: Repository,
  fileId: FileId,
  compute: () => SemanticGraph,
): Promise<SemanticGraph> => {
  const existing = repo.getSemanticGraph(fileId);
  if (existing) return existing;
  const graph = compute();
  repo.putSemanticGraph(fileId, graph);
  return graph;
};
