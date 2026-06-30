/**
 * The application toolbar. Surfaces the most common actions and a
 * few pieces of repository metadata.
 */

import { useAppStore } from "../../store/app-store.js";
import type { AppController } from "../../controllers/index.js";

export interface ToolbarProps {
  readonly controller: AppController | null;
  readonly onOpenDirectory: () => void;
  readonly onOpenSample: () => void;
  readonly onOpenDevRepo: () => void;
  readonly devRepoAvailable: boolean;
  readonly onClear: () => void;
}

export const Toolbar = (props: ToolbarProps) => {
  const repository = useAppStore((s) => s.repository);
  const isLoading = useAppStore((s) => s.isLoading);
  const loadProgress = useAppStore((s) => s.loadProgress);
  const loadError = useAppStore((s) => s.loadError);

  return (
    <div className="h-full flex items-center px-3 gap-3 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-accent-primary/30 border border-accent-primary/50" />
        <span className="font-semibold tracking-tight">Source Narrator</span>
      </div>
      <div className="h-5 w-px bg-line-subtle" />
      <div className="flex items-center gap-1">
        <button className="btn btn-primary" onClick={props.onOpenDirectory} disabled={isLoading}>
          Open repository
        </button>
        {props.devRepoAvailable ? (
          <button className="btn" onClick={props.onOpenDevRepo} disabled={isLoading} title="Open the configured dev repository (vite-plugins/dev-fs)">
            Open dev repo
          </button>
        ) : null}
        <button className="btn" onClick={props.onOpenSample} disabled={isLoading}>
          Load sample
        </button>
        <button className="btn" onClick={props.onClear} disabled={!repository}>
          Clear
        </button>
      </div>
      <div className="flex-1" />
      {repository ? (
        <div className="flex items-center gap-2 text-ink-secondary text-xs">
          <span className="font-mono">{repository.metadata.name}</span>
          <span className="chip">{repository.metadata.fileCount} files</span>
          <span className="chip">{repository.metadata.detectedLanguages.join(", ") || "plain"}</span>
        </div>
      ) : null}
      {isLoading && loadProgress ? (
        <div className="text-xs text-ink-secondary">
          Loading {loadProgress.processed}/{loadProgress.total}
          {loadProgress.currentPath ? ` · ${loadProgress.currentPath}` : ""}
        </div>
      ) : null}
      {loadError ? <div className="text-xs text-status-error">Error: {loadError}</div> : null}
    </div>
  );
};
