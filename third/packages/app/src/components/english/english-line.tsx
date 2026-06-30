/**
 * EnglishLine renders a single English sentence produced by the
 * renderer. It is a presentational component: it does not call
 * controllers. Selection events are forwarded to the caller via
 * `onSelect`.
 *
 * The component is built to be reusable inside the main English
 * panel and inside any other surface (Inspector, hover preview).
 */

import type { CSSProperties, MouseEvent } from "react";
import { useAppStore } from "../../store/app-store.js";
import type { EnglishLine as EnglishLineData } from "@source-narrator/translator-core/model";

export interface EnglishLineProps {
  readonly line: EnglishLineData;
  readonly index: number;
  readonly selected: boolean;
  readonly onSelect: (index: number, event: MouseEvent<HTMLDivElement>) => void;
}

export const EnglishLine = (props: EnglishLineProps) => {
  const { line, index, selected, onSelect } = props;
  const style: CSSProperties = {
    paddingLeft: 12 + (line.indentation ?? 0) * 18,
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(event) => onSelect(index, event)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect(index, event as unknown as MouseEvent<HTMLDivElement>);
        }
      }}
      style={style}
      className={`group cursor-pointer text-sm leading-relaxed py-0.5 pr-3 rounded-sm ${
        selected ? "bg-accent-soft text-ink-primary" : "hover:bg-bg-raised text-ink-primary/90"
      }`}
    >
      <span className="select-none text-ink-muted text-xs mr-2 inline-block w-8 text-right tabular-nums">
        {index + 1}
      </span>
      <span>{line.text}</span>
      {line.semanticNodeIds.length > 0 ? (
        <span className="ml-2 inline-flex gap-1">
          {line.semanticNodeIds.slice(0, 2).map((id) => (
            <span key={id} className="chip">
              {id}
            </span>
          ))}
        </span>
      ) : null}
    </div>
  );
};

/**
 * Hook returning the currently selected English line index, or null
 * if the current selection is not an English line.
 */
export const useSelectedEnglishLine = (): number | null => {
  return useAppStore((s) => {
    if (s.selection?.kind === "english-line") return s.selection.lineIndex;
    return null;
  });
};
