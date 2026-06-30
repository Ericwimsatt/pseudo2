/**
 * Wires the AppController into the React store. The hook should be
 * mounted exactly once near the application root; mounting it more
 * than once will create duplicate subscriptions.
 */

import { useEffect, useRef } from "react";
import { useAppStore } from "../store/app-store.js";
import type { AppController } from "../controllers/index.js";

export const useControllerBindings = (controller: AppController | null): void => {
  const setController = useAppStore((s) => s.setController);
  const setRepository = useAppStore((s) => s.setRepository);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const setSelection = useAppStore((s) => s.setSelection);
  const setLoading = useAppStore((s) => s.setLoading);
  const setLoadProgress = useAppStore((s) => s.setLoadProgress);
  const setLoadError = useAppStore((s) => s.setLoadError);
  const appendLog = useAppStore((s) => s.appendLog);
  const appendPerf = useAppStore((s) => s.appendPerf);
  const appendDiagnostic = useAppStore((s) => s.appendDiagnostic);

  const initial = useRef(false);
  useEffect(() => {
    setController(controller);
    if (!controller) return;
    if (initial.current) return;
    initial.current = true;

    const unsubs: Array<() => void> = [];

    unsubs.push(
      controller.eventBus.on("repository:loaded", ({ repository }) => {
        setRepository(repository);
        setLoading(false);
        setLoadError(null);
      }),
    );
    unsubs.push(controller.eventBus.on("repository:loading", () => setLoading(true)));
    unsubs.push(controller.eventBus.on("repository:cleared", () => setRepository(null)));
    unsubs.push(
      controller.eventBus.on("repository:error", ({ message }) => {
        setLoadError(message);
        setLoading(false);
      }),
    );
    unsubs.push(controller.eventBus.on("file:selected", ({ fileId }) => setSelectedFile(fileId)));
    unsubs.push(controller.eventBus.on("selection:changed", ({ target }) => setSelection(target)));

    const logUnsub = controller.logger.subscribe((entry) => appendLog(entry));
    const perfUnsub = controller.perf.subscribe((record) => appendPerf(record));
    unsubs.push(logUnsub);
    unsubs.push(perfUnsub);

    return () => {
      for (const u of unsubs) u();
      initial.current = false;
    };
  }, [controller, setController, setRepository, setSelectedFile, setSelection, setLoading, setLoadProgress, setLoadError, appendLog, appendPerf, appendDiagnostic]);
};

/** Translate diagnostic records from logs/perf into the diagnostic panel. */
export const useDiagnosticsMirror = (): void => {
  const logs = useAppStore((s) => s.logs);
  const appendDiagnostic = useAppStore((s) => s.appendDiagnostic);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    for (const log of logs.slice(-20)) {
      if (log.level === "info" || log.level === "debug") continue;
      if (seen.current.has(log.id)) continue;
      seen.current.add(log.id);
      appendDiagnostic({
        id: log.id,
        stage: log.stage === "app" ? "application" : log.stage,
        severity: log.level === "error" ? "error" : "warning",
        message: log.message,
        timestamp: log.timestamp,
      });
    }
  }, [logs, appendDiagnostic]);
};
