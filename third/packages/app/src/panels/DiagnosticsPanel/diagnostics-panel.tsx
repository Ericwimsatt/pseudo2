/**
 * The Diagnostics panel surfaces parser warnings, unsupported syntax
 * notices, renderer warnings, and semantic errors. Diagnostics are
 * aggregated across the whole repository, with the current file's
 * issues listed first.
 */

import { useMemo, useState } from "react";
import { useAppStore } from "../../store/app-store.js";
import { AlertTriangle, Info, FileText } from "../../components/icons.js";
import type { Diagnostic, DiagnosticSeverity, DiagnosticStage } from "@source-narrator/shared";
import type { SourceFile } from "@source-narrator/translator-core/model";

const SEVERITY_COLOR: Record<DiagnosticSeverity, string> = {
  info: "text-status-info",
  warning: "text-status-warn",
  error: "text-status-error",
};

const SEVERITY_ORDER: Record<DiagnosticSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

interface FileDiagnostics {
  readonly file: SourceFile;
  readonly parser: readonly Diagnostic[];
  readonly unknownCount: number;
}

export const DiagnosticsPanel = () => {
  const storedDiagnostics = useAppStore((s) => s.diagnostics);
  const repo = useAppStore((s) => s.repository);
  const fileId = useAppStore((s) => s.selectedFileId);
  const [scope, setScope] = useState<"current" | "all">("current");

  const perFile = useMemo<readonly FileDiagnostics[]>(() => {
    if (!repo) return [];
    const out: FileDiagnostics[] = [];
    for (const f of repo.files()) {
      const tree = repo.getParseTree(f.id);
      const graph = repo.getSemanticGraph(f.id);
      const parser: Diagnostic[] = (tree?.diagnostics ?? []).map((d, i) => ({
        id: `parse-${f.id}-${i}`,
        stage: "parser",
        severity: "warning",
        message: d.message,
        timestamp: Date.now(),
      }));
      const unknownCount = graph ? graph.nodes.filter((n) => n.kind === "unknown").length : 0;
      out.push({ file: f, parser, unknownCount });
    }
    return out;
  }, [repo]);

  const currentFileDiags = useMemo(() => {
    if (!fileId) return { parser: [] as readonly Diagnostic[], unknownCount: 0, file: null as SourceFile | null };
    const entry = perFile.find((e) => e.file.id === fileId);
    if (!entry) return { parser: [] as readonly Diagnostic[], unknownCount: 0, file: null };
    return { parser: entry.parser, unknownCount: entry.unknownCount, file: entry.file };
  }, [perFile, fileId]);

  const allIssues = useMemo(() => {
    return perFile
      .flatMap((e) => e.parser.map((d) => ({ ...d, _file: e.file })))
      .filter((d) => d.severity === "warning" || d.severity === "error")
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
  }, [perFile]);

  const totalUnknowns = perFile.reduce((sum, e) => sum + e.unknownCount, 0);
  const totalFilesWithIssues = perFile.filter((e) => e.parser.length > 0 || e.unknownCount > 0).length;

  const visible: readonly Diagnostic[] = scope === "current" ? currentFileDiags.parser : storedDiagnostics;

  return (
    <div className="h-full overflow-auto text-xs font-mono flex flex-col">
      <div className="flex items-center justify-between px-3 py-1 text-[11px] uppercase tracking-wide text-ink-muted border-b border-line-subtle">
        <span>Diagnostics</span>
        <div className="flex items-center gap-2">
          <button
            className={`px-1.5 py-0.5 rounded text-[10px] ${scope === "current" ? "bg-bg-raised text-ink-primary" : "text-ink-muted"}`}
            onClick={() => setScope("current")}
          >
            Current file
          </button>
          <button
            className={`px-1.5 py-0.5 rounded text-[10px] ${scope === "all" ? "bg-bg-raised text-ink-primary" : "text-ink-muted"}`}
            onClick={() => setScope("all")}
          >
            Application
          </button>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-line-subtle grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <div className="text-ink-muted uppercase tracking-wide">Files with issues</div>
          <div className="text-ink-primary text-sm font-semibold">{totalFilesWithIssues}</div>
        </div>
        <div>
          <div className="text-ink-muted uppercase tracking-wide">Parser warnings</div>
          <div className="text-ink-primary text-sm font-semibold">
            {allIssues.filter((d) => d.stage === "parser").length}
          </div>
        </div>
        <div>
          <div className="text-ink-muted uppercase tracking-wide">Unknown semantics</div>
          <div className="text-ink-primary text-sm font-semibold">{totalUnknowns}</div>
        </div>
      </div>

      {scope === "current" ? (
        <div className="flex-1 min-h-0 overflow-auto">
          {!currentFileDiags.file ? (
            <EmptyState message="Select a file to view its diagnostics." />
          ) : currentFileDiags.parser.length === 0 && currentFileDiags.unknownCount === 0 ? (
            <EmptyState message={`${currentFileDiags.file.path}: no diagnostics. The translation succeeded for every construct in this file.`} />
          ) : (
            <>
              {currentFileDiags.parser.map((d) => (
                <DiagnosticRow key={d.id} diagnostic={d} filePath={currentFileDiags.file!.path} />
              ))}
              {currentFileDiags.unknownCount > 0 ? (
                <div className="flex items-start gap-2 px-3 py-2 border-b border-line-subtle bg-status-warn/10">
                  <span className="mt-0.5">
                    <AlertTriangle size={12} className="text-status-warn" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-ink-primary">
                      {currentFileDiags.unknownCount} semantic node{currentFileDiags.unknownCount === 1 ? "" : "s"} could not be translated.
                    </div>
                    <div className="text-ink-muted">
                      The English renderer produces a generic sentence for these. See the Semantic IR tab for details.
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">
          {visible.length === 0 ? (
            <EmptyState message="No application diagnostics. The translation pipeline runs without warnings or errors." />
          ) : (
            visible.map((d) => <DiagnosticRow key={d.id} diagnostic={d} />)
          )}
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="p-3 text-ink-muted">
    <p>{message}</p>
  </div>
);

const DiagnosticRow = ({ diagnostic, filePath }: { diagnostic: Diagnostic; filePath?: string }) => (
  <div className="flex items-start gap-2 px-3 py-1 border-b border-line-subtle">
    <span className="mt-0.5">
      {diagnostic.severity === "error" || diagnostic.severity === "warning" ? (
        <AlertTriangle size={12} className={SEVERITY_COLOR[diagnostic.severity]} />
      ) : (
        <Info size={12} className={SEVERITY_COLOR[diagnostic.severity]} />
      )}
    </span>
    <div className="flex-1 min-w-0">
      <div className="text-ink-primary">{diagnostic.message}</div>
      <div className="text-ink-muted flex items-center gap-1">
        <span>{diagnostic.stage as DiagnosticStage}</span>
        {filePath ? (
          <>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <FileText size={10} /> {filePath}
            </span>
          </>
        ) : null}
        <span>·</span>
        <span>{new Date(diagnostic.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  </div>
);
