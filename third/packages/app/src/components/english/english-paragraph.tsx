/**
 * EnglishParagraph groups one or more EnglishLines that share a
 * paragraph id. The renderer is free to assign paragraph ids or
 * omit them; the panel falls back to a single paragraph when none
 * are provided.
 */

import type { ReactNode } from "react";
import type { EnglishLine as EnglishLineData } from "@source-narrator/translator-core/model";
import { EnglishLine } from "./english-line.js";

export interface EnglishParagraphProps {
  readonly id: string;
  readonly title?: ReactNode;
  readonly lines: readonly EnglishLineData[];
  readonly startIndex: number;
  readonly selectedIndex: number | null;
  readonly onSelectLine: (index: number) => void;
}

export const EnglishParagraph = (props: EnglishParagraphProps) => (
  <div className="py-2">
    {props.title ? (
      <header className="px-3 pb-1 text-[11px] uppercase tracking-wide text-ink-muted">{props.title}</header>
    ) : null}
    <div className="px-1.5">
      {props.lines.map((line, i) => {
        const absoluteIndex = props.startIndex + i;
        return (
          <EnglishLine
            key={`${props.id}-${absoluteIndex}`}
            line={line}
            index={absoluteIndex}
            selected={absoluteIndex === props.selectedIndex}
            onSelect={(idx) => props.onSelectLine(idx)}
          />
        );
      })}
    </div>
  </div>
);
