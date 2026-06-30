/**
 * Orchestrates the full translation pipeline for a single file:
 *   parse → semantic graph → English lines
 *
 * The controller is the only place in the app that coordinates
 * these three steps; panels observe the resulting caches on the
 * Repository and the events emitted here.
 *
 * Caching: results are stored on the Repository so that switching
 * files and switching back does not re-run the pipeline.
 */

import {
  createLogger,
  TypedEventBus,
  createPerfRecorder,
  type Logger,
  type PerfRecorder,
  type FileId,
} from "@source-narrator/shared";
import type { Repository } from "@source-narrator/translator-core/model";
import type { AppEventMap } from "./events.js";
import type { EnglishRenderer } from "@source-narrator/translator-core/renderers/english";
import type { RepositoryController } from "./repository-controller.js";

export interface TranslationControllerDeps {
  readonly eventBus: TypedEventBus<AppEventMap>;
  readonly repository: RepositoryController;
  readonly renderer: EnglishRenderer;
  readonly logger?: Logger;
  readonly perf?: PerfRecorder;
}

export interface TranslationController {
  readonly deps: TranslationControllerDeps;
  translate(fileId: FileId): Promise<void>;
  invalidate(fileId: FileId): void;
}

export const createTranslationController = (deps: TranslationControllerDeps): TranslationController => {
  const logger = deps.logger ?? createLogger();
  const perf = deps.perf ?? createPerfRecorder();
  const inflight = new Map<FileId, Promise<void>>();

  const runPipeline = async (fileId: FileId): Promise<void> => {
    const repo = deps.repository.current();
    if (!repo) {
      logger.warn("app", "Translation requested without a repository loaded");
      return;
    }
    const file = repo.fileById(fileId);
    if (!file) {
      logger.warn("app", `Translation requested for unknown file: ${fileId}`);
      return;
    }

    const service = repo.languageServices.find((s) => s.id === file.language) ?? null;
    if (!service) {
      logger.warn("app", `No language service for: ${file.path}`);
      return;
    }

    // Parse
    const parseEnd = perf.start(`parse:${file.path}`);
    const parseTree = service.parse(fileId, file.path, file.content);
    parseEnd();
    const astRoot = (parseTree.root && typeof parseTree.root === "object" && "kind" in parseTree.root)
      ? (parseTree.root as unknown as import("@source-narrator/language-typescript/parser").AstNode)
      : undefined;
    const astNodeCount = astRoot ? countAst(astRoot) : 0;
    repo.putParseTree(fileId, {
      tree: parseTree,
      languageId: service.id,
      diagnostics: parseTree.diagnostics.map((d) => ({ message: d.message })),
      astRoot,
      astNodeCount,
    });
    deps.eventBus.emit("file:parsed", { fileId, nodeCount: astNodeCount });

    for (const diag of parseTree.diagnostics) {
      logger.warn("parser", `${file.path}: ${diag.message}`);
    }

    // Semantic
    const semEnd = perf.start(`semantic:${file.path}`);
    const graph = service.toSemanticGraph(fileId, parseTree, file.content);
    semEnd();
    repo.putSemanticGraph(fileId, graph);
    deps.eventBus.emit("file:semantic", { fileId, graph });

    const unknowns = graph.nodes.filter((n) => n.kind === "unknown");
    if (unknowns.length > 0) {
      logger.warn(
        "semantic",
        `${file.path}: ${unknowns.length} untranslated semantic node${unknowns.length === 1 ? "" : "s"}`,
        { samples: unknowns.slice(0, 3).map((n) => `line ${n.source.start.line}`) },
      );
    }

    // Render
    const renderEnd = perf.start(`render:${file.path}`);
    const lines = deps.renderer.render(graph);
    renderEnd();
    repo.putEnglish(fileId, lines);
    deps.eventBus.emit("file:english", { fileId, lines });

    logger.info("app", `Translated ${file.path}`, {
      astNodes: astNodeCount,
      semanticNodes: graph.nodes.length,
      englishLines: lines.length,
      unknownNodes: unknowns.length,
    });
  };

  return {
    deps,
    translate(fileId) {
      const existing = inflight.get(fileId);
      if (existing) return existing;
      const p = runPipeline(fileId).finally(() => {
        inflight.delete(fileId);
      });
      inflight.set(fileId, p);
      return p;
    },
    invalidate(fileId) {
      // The simplest invalidation is to drop the relevant caches. The
      // Repository does not currently expose a delete API; a fuller
      // implementation will add one.
      logger.debug("app", `Invalidate requested for ${fileId}`);
    },
  };
};

const countAst = (node: import("@source-narrator/language-typescript/parser").AstNode): number => {
  let total = 0;
  const visit = (n: import("@source-narrator/language-typescript/parser").AstNode): void => {
    total += 1;
    for (const c of n.children) visit(c);
  };
  visit(node);
  return total;
};
