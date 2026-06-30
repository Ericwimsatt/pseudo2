/**
 * Owns the current Repository. Responsible for loading, exposing the
 * file list, and providing the language services. The controller
 * emits events; the React layer observes them via Zustand or hooks.
 *
 * Dependencies are injected for testability.
 */

import {
  createLogger,
  TypedEventBus,
  createPerfRecorder,
  type Logger,
  type PerfRecorder,
} from "@source-narrator/shared";
import type { Repository, LanguageService } from "@source-narrator/translator-core/model";
import { loadRepository, type FileSystem, type LoadProgress } from "../infrastructure/index.js";
import type { AppEventMap } from "./events.js";

export interface RepositoryControllerDeps {
  readonly languageServices: readonly LanguageService[];
  readonly eventBus: TypedEventBus<AppEventMap>;
  readonly logger?: Logger;
  readonly perf?: PerfRecorder;
}

export interface RepositoryController {
  readonly deps: RepositoryControllerDeps;
  current(): Repository | null;
  load(fs: FileSystem, opts?: { maxBytes?: number; onProgress?: (p: LoadProgress) => void }): Promise<Repository>;
  clear(): void;
}

export const createRepositoryController = (deps: RepositoryControllerDeps): RepositoryController => {
  const logger = deps.logger ?? createLogger();
  const perf = deps.perf ?? createPerfRecorder();
  let currentRepo: Repository | null = null;

  return {
    deps,
    current: () => currentRepo,
    async load(fs, opts) {
      deps.eventBus.emit("repository:loading", { name: fs.name });
      try {
        const end = perf.start(`load:${fs.name}`);
        const result = await loadRepository(fs, deps.languageServices, {
          logger,
          maxBytes: opts?.maxBytes,
          onProgress: opts?.onProgress,
        });
        end();
        currentRepo = result.repository;
        deps.eventBus.emit("repository:loaded", { repository: result.repository });
        return result.repository;
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        logger.error("filesystem", "Failed to load repository", { message });
        deps.eventBus.emit("repository:error", { message });
        throw cause;
      }
    },
    clear() {
      currentRepo = null;
      deps.eventBus.emit("repository:cleared", {});
    },
  };
};
