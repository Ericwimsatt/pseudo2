/**
 * The application shell. Composes the layout, controller, and
 * repository bootstrap. The shell is intentionally minimal; all
 * behaviour lives in controllers and panels.
 */

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { AppLayout } from "./components/layout/app-layout.js";
import { Toolbar } from "./components/layout/toolbar.js";
import { RepositoryTree } from "./components/sidebar/repository-tree.js";
import { DevTabs } from "./components/devtools/dev-tabs.js";
import { EnglishPanel } from "./panels/EnglishView/english-panel.js";
import { InspectorPanel } from "./panels/Inspector/inspector-panel.js";
import { useAppStore } from "./store/app-store.js";
import { useControllerBindings, useDiagnosticsMirror } from "./hooks/use-controller-bindings.js";
import { createAppController, type AppController } from "./controllers/index.js";
import {
  createInMemoryFileSystem,
  createDevFileSystem,
  fsFromDataTransferItems,
  isDevFileSystemAvailable,
  openDirectory,
  isDirectoryPickerSupported,
  type FileSystem,
} from "./infrastructure/index.js";
import { SAMPLE_FILES } from "./hooks/sample-files.js";

const useAppController = (): AppController => {
  const [controller] = useState<AppController>(() => createAppController());
  useEffect(() => {
    return () => controller.dispose();
  }, [controller]);
  return controller;
};

export const App = () => {
  const controller = useAppController();
  const setController = useAppStore((s) => s.setController);
  useControllerBindings(controller);
  useDiagnosticsMirror();
  const [dropActive, setDropActive] = useState(false);
  const [devAvailable, setDevAvailable] = useState(false);
  const dropCounter = useRef(0);

  useEffect(() => {
    setController(controller);
  }, [controller, setController]);

  useEffect(() => {
    let cancelled = false;
    isDevFileSystemAvailable().then((ok) => {
      if (!cancelled) setDevAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onOpenDirectory = useCallback(async () => {
    if (!isDirectoryPickerSupported()) {
      controller.logger.warn(
        "app",
        "This browser does not support the File System Access API. Use the dev repo button, the sample repository, drag-and-drop a folder, or try a Chromium-based browser.",
      );
      return;
    }
    const fs = await openDirectory();
    if (fs) {
      await controller.repository.load(fs);
    }
  }, [controller]);

  const onOpenDevRepo = useCallback(async () => {
    try {
      const fs = await createDevFileSystem();
      await controller.repository.load(fs, { maxBytes: 4 * 1024 * 1024 });
    } catch (cause) {
      controller.logger.error("filesystem", "Failed to load dev repository", {
        message: cause instanceof Error ? cause.message : String(cause),
      });
    }
  }, [controller]);

  const onOpenSample = useCallback(async () => {
    const fs: FileSystem = createInMemoryFileSystem("Sample repository", SAMPLE_FILES);
    await controller.repository.load(fs);
  }, [controller]);

  const onClear = useCallback(() => {
    controller.repository.clear();
  }, [controller]);

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDropActive(false);
      dropCounter.current = 0;
      const items = event.dataTransfer.items;
      if (!items || items.length === 0) return;
      const list = Array.from(items);
      try {
        const fs = await fsFromDataTransferItems(list);
        await controller.repository.load(fs);
      } catch (cause) {
        controller.logger.error("filesystem", "Failed to load dropped folder", {
          message: cause instanceof Error ? cause.message : String(cause),
        });
      }
    },
    [controller],
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dropCounter.current += 1;
    if (event.dataTransfer.types.includes("Files")) {
      setDropActive(true);
    }
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dropCounter.current = Math.max(0, dropCounter.current - 1);
    if (dropCounter.current === 0) setDropActive(false);
  }, []);

  const repository = useAppStore((s) => s.repository);
  const selectedFile = useMemo(() => {
    const id = useAppStore.getState().selectedFileId;
    if (!id || !repository) return null;
    return repository.fileById(id);
  }, [repository]);

  const onSelectFile = useCallback(
    (file: import("@source-narrator/translator-core/model").SourceFile) => {
      controller.navigation.selectFile(file.id);
    },
    [controller],
  );

  return (
    <div
      className="h-full w-full relative"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
    >
      <AppLayout
        toolbar={
          <Toolbar
            controller={controller}
            onOpenDirectory={onOpenDirectory}
            onOpenSample={onOpenSample}
            onOpenDevRepo={onOpenDevRepo}
            devRepoAvailable={devAvailable}
            onClear={onClear}
          />
        }
        sidebar={<RepositoryTree onSelect={onSelectFile} />}
        main={<EnglishViewMain selectedFile={selectedFile} />}
        inspector={<InspectorPanel />}
        devTabs={<DevTabs />}
      />
      {dropActive ? (
        <div className="absolute inset-2 border-2 border-dashed border-accent-primary/70 rounded-md pointer-events-none flex items-center justify-center text-ink-primary bg-bg-base/60">
          <div className="text-center">
            <div className="text-lg font-semibold">Drop folder to load</div>
            <div className="text-xs text-ink-secondary mt-1">
              The folder's text files will be added to the repository.
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const EnglishViewMain = ({ selectedFile }: { selectedFile: import("@source-narrator/translator-core/model").SourceFile | null }) => {
  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8 text-ink-secondary">
        <div>
          <div className="text-lg font-semibold text-ink-primary">Source Narrator</div>
          <p className="mt-2 max-w-md">
            Open a local repository to view each file as a series of plain-English sentences derived from a
            language-independent semantic graph.
          </p>
        </div>
      </div>
    );
  }
  return <EnglishPanel />;
};
