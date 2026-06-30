/**
 * The Source panel displays the raw text of the currently selected
 * file with line numbers. Clicking on a line propagates a source
 * range selection through the navigation controller.
 */

import { useMemo, useRef, useEffect } from "react";
import { useAppStore, selectCurrentFile } from "../../store/app-store.js";
import type { SourceRange } from "@source-narrator/shared";

export const SourcePanel = () => {
  const file = useAppStore(selectCurrentFile);
  const selection = useAppStore((s) => s.selection);
  const controller = useAppStore((s) => s.controller);
  const containerRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => (file ? file.content.split("\n") : []), [file]);

  useEffect(() => {
    if (!containerRef.current) return;
    if (selection?.kind !== "source-range") return;
    const start = selection.range.start.line;
    const el = containerRef.current.querySelector<HTMLElement>(`[data-line="${start}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selection]);

  if (!file) {
    return (
      <div className="p-4 text-sm text-ink-secondary">
        <p>Select a file from the repository tree to view its source.</p>
      </div>
    );
  }

  const handleClick = (lineNumber: number) => {
    if (!controller) return;
    const fileId = useAppStore.getState().selectedFileId;
    if (!fileId) return;
    const range: SourceRange = {
      start: { line: lineNumber, column: 1 },
      end: { line: lineNumber, column: lines[lineNumber - 1]?.length ?? 1 },
    };
    controller.navigation.selectSourceRange(fileId, range);
  };

  return (
    <div ref={containerRef} className="h-full overflow-auto bg-bg-sunken text-ink-primary font-mono text-xs leading-5">
      {lines.map((line, i) => {
        const lineNumber = i + 1;
        const isHighlighted =
          selection?.kind === "source-range" &&
          lineNumber >= selection.range.start.line &&
          lineNumber <= selection.range.end.line;
        return (
          <div
            key={lineNumber}
            data-line={lineNumber}
            onClick={() => handleClick(lineNumber)}
            className={`flex cursor-pointer hover:bg-bg-raised ${isHighlighted ? "bg-accent-soft/60" : ""}`}
          >
            <div className="select-none text-right text-ink-muted w-10 px-2 border-r border-line-subtle shrink-0">
              {lineNumber}
            </div>
            <pre className="whitespace-pre pl-3 pr-4 flex-1">{line || " "}</pre>
          </div>
        );
      })}
    </div>
  );
};
