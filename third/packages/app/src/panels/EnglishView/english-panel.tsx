/**
 * The English panel renders the English output of the renderer.
 * It groups lines into paragraphs when the renderer assigns a
 * paragraph id, otherwise it produces a single paragraph.
 */

import { useMemo } from "react";
import { useAppStore, selectCurrentEnglish } from "../../store/app-store.js";
import { EnglishParagraph } from "../../components/english/english-paragraph.js";
import type { EnglishLine } from "@source-narrator/translator-core/model";

interface Group {
  readonly id: string;
  readonly title: string | null;
  readonly lines: readonly EnglishLine[];
  readonly startIndex: number;
}

const groupLines = (lines: readonly EnglishLine[]): readonly Group[] => {
  const groups: Group[] = [];
  let current: Group | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    const paragraphId = line.paragraphId ?? "default";
    if (!current || current.id !== paragraphId) {
      current = { id: paragraphId, title: null, lines: [], startIndex: i };
      groups.push(current);
    }
    (current.lines as EnglishLine[]).push(line);
  }
  return groups;
};

export const EnglishPanel = () => {
  const lines = useAppStore(selectCurrentEnglish);
  const selection = useAppStore((s) => s.selection);
  const controller = useAppStore((s) => s.controller);
  const groups = useMemo(() => groupLines(lines), [lines]);

  const selectedIndex: number | null = selection?.kind === "english-line" ? selection.lineIndex : null;

  const handleSelect = (index: number) => {
    const fileId = useAppStore.getState().selectedFileId;
    if (!fileId || !controller) return;
    controller.navigation.selectEnglishLine(fileId, index);
    // Also try to mirror the selection into a source range so the
    // Source panel can scroll to the corresponding location.
    const line = lines[index];
    if (line?.sourceRange) {
      controller.navigation.selectSourceRange(fileId, line.sourceRange);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="p-4 text-sm text-ink-secondary">
        <p>No English rendering available for the current file.</p>
        <p className="mt-1 text-xs text-ink-muted">
          The renderer produces one or more sentences per semantic node; this view will populate when a file is selected.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {groups.map((g) => (
        <EnglishParagraph
          key={g.id}
          id={g.id}
          {...(g.title ? { title: g.title } : {})}
          lines={g.lines}
          startIndex={g.startIndex}
          selectedIndex={selectedIndex}
          onSelectLine={handleSelect}
        />
      ))}
    </div>
  );
};
