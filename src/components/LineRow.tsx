import type { LineRenderable } from '../lib/renderable/types';
import { BUCKET_LABELS } from '../lib/renderable/bucket';
import { cx } from './nodes/styleHelpers';
import { NodeLayer } from './nodes/NodeLayer';
import { SearchContext } from '../lib/searchContext';
import { useRef, useEffect, useState, useMemo } from 'react';

interface SearchMatch {
  lineIndex: number;
  inSource: boolean;
  inTranslation: boolean;
}

interface Props {
  line: LineRenderable;
  lineIndex: number;
  bucketStyle: string;
  isInterface: boolean;
  onResizeStart: (e: React.MouseEvent) => void;
  sourcePct: number;
  searchTerm?: string;
  searchMatches?: SearchMatch[];
  activeMatchIndex?: number;
  navVar?: string;
  isNavHighlight?: boolean;
  parentRowIndex?: number | null;
}

function highlightSourceText(text: string, term: string, isActive: boolean) {
  if (!term) return text;
  const lower = text.toLowerCase();
  const termLower = term.toLowerCase();
  const parts: { t: string; match: boolean }[] = [];
  let lastIndex = 0;
  let index = lower.indexOf(termLower);
  while (index !== -1) {
    if (index > lastIndex) {
      parts.push({ t: text.slice(lastIndex, index), match: false });
    }
    parts.push({ t: text.slice(index, index + term.length), match: true });
    lastIndex = index + term.length;
    index = lower.indexOf(termLower, lastIndex);
  }
  if (lastIndex < text.length) {
    parts.push({ t: text.slice(lastIndex), match: false });
  }
  return parts.map((p, i) =>
    p.match ? (
      <mark
        key={i}
        className={cx(
          'rounded-sm',
          isActive ? 'bg-yellow-300 text-black' : 'bg-yellow-100 text-black'
        )}
      >
        {p.t}
      </mark>
    ) : (
      <span key={i}>{p.t}</span>
    )
  );
}

export function LineRow({
  line,
  lineIndex,
  bucketStyle,
  isInterface,
  onResizeStart,
  sourcePct,
  searchTerm,
  searchMatches,
  activeMatchIndex,
  navVar,
  isNavHighlight,
  parentRowIndex,
}: Props) {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (isNavHighlight && rowRef.current) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isNavHighlight]);

  const showTranslation = !line.skipTranslation && line.nodes.length > 0;
  const rowSpan = line.translationRowSpan;

  const effectiveSearchTerm = searchTerm || navVar || '';

  const sourceHasTerm = effectiveSearchTerm &&
    line.sourceText.toLowerCase().includes(effectiveSearchTerm.toLowerCase());

  function matchIndexForLine(targetLineIndex: number, checkTrans: boolean): number {
    return searchMatches?.findIndex((m) =>
      m.lineIndex === targetLineIndex && (checkTrans ? m.inTranslation : m.inSource)
    ) ?? -1;
  }

  function parentTransMatchActive(): boolean {
    if (parentRowIndex == null || parentRowIndex < 0) return false;
    const idx = matchIndexForLine(parentRowIndex, true);
    return idx >= 0 && idx === activeMatchIndex;
  }

  const isActiveSource = (() => {
    if (!searchTerm) return false;
    const idx = matchIndexForLine(lineIndex, false);
    if (idx >= 0) return idx === activeMatchIndex;
    return parentTransMatchActive();
  })();

  const searchCtxValue = useMemo(() => {
    if (!effectiveSearchTerm) return { term: '', isActiveMatch: false };
    const term = effectiveSearchTerm;
    let isActive = false;
    if (searchTerm) {
      const myIdx = searchMatches?.findIndex((m) => m.lineIndex === lineIndex && m.inTranslation) ?? -1;
      isActive = myIdx === activeMatchIndex;
      if (!isActive && parentRowIndex != null && parentRowIndex >= 0) {
        const parentIdx = searchMatches?.findIndex((m) => m.lineIndex === parentRowIndex && m.inTranslation) ?? -1;
        isActive = parentIdx === activeMatchIndex;
      }
    }
    return { term, isActiveMatch: isActive };
  }, [effectiveSearchTerm, searchTerm, searchMatches, lineIndex, activeMatchIndex, parentRowIndex]);

  return (
    <tr
      ref={rowRef}
      className={cx(
        'hover:bg-gray-50/40 transition-colors',
        bucketStyle,
        flash && 'animate-pulse bg-yellow-50'
      )}
      data-bucket={BUCKET_LABELS[line.bucket]}
      data-line={line.lineNumber}
    >
      <td
        className={cx(
          'p-0 align-top border-l-2',
          isInterface ? 'border-blue-500' : 'border-transparent'
        )}
        style={{ width: 6 }}
      />
      <td className="text-right pr-3 py-1 text-gray-400 select-none border-r border-gray-200 bg-gray-50 align-top font-mono text-xs">
        {line.lineNumber}
      </td>
      <td
        className="py-1 align-top border-r border-gray-200"
        style={{ width: `${sourcePct}%` }}
      >
        <div className="px-4 whitespace-pre-wrap break-words font-mono text-sm">
          {sourceHasTerm
            ? highlightSourceText(
                line.sourceText || '',
                effectiveSearchTerm,
                isActiveSource
              )
            : line.sourceText || '\u00A0'}
        </div>
      </td>
      <td
        className="cursor-col-resize bg-gray-100 hover:bg-blue-300 active:bg-blue-400 p-0 align-top border-r border-gray-200"
        style={{ width: 4 }}
        onMouseDown={onResizeStart}
      />
      {showTranslation && (
        <td
          className="px-4 py-1 align-top"
          rowSpan={rowSpan && rowSpan > 1 ? rowSpan : undefined}
        >
          <SearchContext.Provider value={searchCtxValue}>
            <NodeLayer nodes={line.nodes} />
          </SearchContext.Provider>
        </td>
      )}
    </tr>
  );
}
