/**
 * The AppController composes the four individual controllers and
 * wires them up to a single shared event bus. Application code
 * should depend on AppController rather than on the individual
 * controllers, so cross-controller wiring is owned by the
 * composition root.
 */

import { TypedEventBus, createLogger, createPerfRecorder, type Logger, type PerfRecorder } from "@source-narrator/shared";
import type { LanguageService } from "@source-narrator/translator-core/model";
import { createEnglishRenderer, type EnglishRenderer } from "@source-narrator/translator-core/renderers/english";
import { createTypeScriptLanguageService } from "@source-narrator/language-typescript";

import { createRepositoryController, type RepositoryController } from "./repository-controller.js";
import { createNavigationController, type NavigationController } from "./navigation-controller.js";
import { createTranslationController, type TranslationController } from "./translation-controller.js";
import { createInspectorController, type InspectorController } from "./inspector-controller.js";
import type { AppEventMap } from "./events.js";

export interface AppControllerOptions {
  readonly languageServices?: readonly LanguageService[];
  readonly englishRenderer?: EnglishRenderer;
  readonly logger?: Logger;
  readonly perf?: PerfRecorder;
}

export interface AppController {
  readonly eventBus: TypedEventBus<AppEventMap>;
  readonly logger: Logger;
  readonly perf: PerfRecorder;
  readonly repository: RepositoryController;
  readonly navigation: NavigationController;
  readonly translation: TranslationController;
  readonly inspector: InspectorController;
  readonly languageServices: readonly LanguageService[];
  dispose(): void;
}

export const createAppController = (options: AppControllerOptions = {}): AppController => {
  const logger = options.logger ?? createLogger();
  const perf = options.perf ?? createPerfRecorder();
  const eventBus = new TypedEventBus<AppEventMap>();

  const languageServices = options.languageServices ?? [createTypeScriptLanguageService()];
  const renderer = options.englishRenderer ?? createEnglishRenderer();

  const repository = createRepositoryController({
    eventBus,
    logger,
    perf,
    languageServices,
  });
  const navigation = createNavigationController({ eventBus, logger });
  const translation = createTranslationController({
    eventBus,
    repository,
    renderer,
    logger,
    perf,
  });
  const inspector = createInspectorController({
    eventBus,
    repository,
    navigation,
    logger,
  });

  // When a file is selected, kick off the translation pipeline so all
  // panels are populated.
  eventBus.on("file:selected", ({ fileId }) => {
    void translation.translate(fileId);
  });

  return {
    eventBus,
    logger,
    perf,
    repository,
    navigation,
    translation,
    inspector,
    languageServices,
    dispose() {
      eventBus.clear();
    },
  };
};
