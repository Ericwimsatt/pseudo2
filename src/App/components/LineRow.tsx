import type { LineRenderable } from '../../main/translationService/renderable/types';
import { BUCKET_LABELS } from '../../main/translationService/renderable/bucket';
import { cx } from './nodes/styleHelpers';
import { BoxFragment } from './nodes/BoxFragment';
import { SearchContext } from '../lib/searchContext';
import { useRef, useMemo } from 'react';
import type { SelectionMode } from './CodeTable';

interface SearchMatch {
  lineIndex: number;
  inSource: boolean;
  inTranslation: boolean;
}

interface Props {
  rowNum: number;
  line: LineRenderable;
  lineIndex: number;
  isInterface: boolean;
  onResizeStart: (e: React.MouseEvent) => void;
  searchTerm?: string;
  searchMatches?: SearchMatch[];
  activeMatchIndex?: number;
  navVar?: string;
  selectionMode?: SelectionMode;
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
  rowNum,
  line,
  lineIndex,
  isInterface,
  onResizeStart,
  searchTerm,
  searchMatches,
  activeMatchIndex,
  navVar,
  selectionMode = 'both',
}: Props) {
  const lineRef = useRef<HTMLDivElement>(null);

  const showTranslation = line.boxFragment !== null;

  const effectiveSearchTerm = searchTerm || navVar || '';

  const sourceHasTerm = effectiveSearchTerm &&
    line.sourceText.toLowerCase().includes(effectiveSearchTerm.toLowerCase());

  function matchIndexForLine(targetLineIndex: number, checkTrans: boolean): number {
    return searchMatches?.findIndex((m) =>
      m.lineIndex === targetLineIndex && (checkTrans ? m.inTranslation : m.inSource)
    ) ?? -1;
  }

  const isActiveSource = (() => {
    if (!searchTerm) return false;
    const idx = matchIndexForLine(lineIndex, false);
    return idx >= 0 && idx === activeMatchIndex;
  })();

  const searchCtxValue = useMemo(() => {
    if (!effectiveSearchTerm) return { term: '', isActiveMatch: false };
    const term = effectiveSearchTerm;
    let isActive = false;
    if (searchTerm) {
      const myIdx = searchMatches?.findIndex((m) => m.lineIndex === lineIndex && m.inTranslation) ?? -1;
      isActive = myIdx === activeMatchIndex;
    }
    return { term, isActiveMatch: isActive };
  }, [effectiveSearchTerm, searchTerm, searchMatches, lineIndex, activeMatchIndex]);

  return (
    <>
      <div
        className={cx('border-l-2', isInterface ? 'border-blue-500' : 'border-transparent')}
        style={{ gridRow: rowNum, gridColumn: 1 }}
      />
      <div
        className="text-right pr-3 py-1 text-gray-400 select-none border-r border-gray-200 bg-gray-50 align-top font-mono text-xs"
        style={{ gridRow: rowNum, gridColumn: 2 }}
      >
        {line.lineNumber}
      </div>
      <div
        ref={lineRef}
        className={cx(
          'py-1 border-r border-gray-200 hover:bg-gray-50/40 transition-colors',
          selectionMode === 'translation' && 'select-none'
        )}
        style={{ gridRow: rowNum, gridColumn: 3 }}
        data-bucket={BUCKET_LABELS[line.bucket]}
        data-line={line.lineNumber}
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
      </div>
      <div
        className="cursor-col-resize bg-gray-100 hover:bg-blue-300 active:bg-blue-400 p-0 border-r border-gray-200"
        style={{ gridRow: rowNum, gridColumn: 4 }}
        onMouseDown={onResizeStart}
      />
      <div style={{ gridRow: rowNum, gridColumn: 5 }} />
      {showTranslation && (
        <div
          className={cx(selectionMode === 'source' && 'select-none')}
          style={{ gridRow: rowNum, gridColumn: 6 }}
        >
          <SearchContext.Provider value={searchCtxValue}>
            <BoxFragment fragment={line.boxFragment!} />
          </SearchContext.Provider>
        </div>
      )}
    </>
  );
}
