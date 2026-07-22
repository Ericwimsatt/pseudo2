import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { DisplayNodeData, LineRenderable, ViewModel } from '../../main/translationService/renderable/types';
import { BUCKET_STYLES } from '../../main/translationService/renderable/bucket';
import { HoverProvider } from './hover/HoverContext';
import { LineRow } from './LineRow';
import { HoverPopover } from './hover/HoverPopover';
import { cx } from './nodes/styleHelpers';

interface CodeTableProps {
  viewModel: ViewModel;
  fileName: string;
  targetSourceLine?: number | null;
  targetTransLine?: number | null;
  targetVar?: string | null;
}

export interface SearchMatch {
  lineIndex: number;
  inSource: boolean;
  inTranslation: boolean;
}

export function parentIndices(lines: LineRenderable[]): (number | null)[] {
  const result: (number | null)[] = new Array(lines.length).fill(null);
  for (let i = 0; i < lines.length; i++) {
    const rs = lines[i].translationRowSpan;
    if (rs) {
      for (let k = i + 1; k < i + rs && k < lines.length; k++) {
        result[k] = i;
      }
    }
  }
  return result;
}

export function dedupMatches(lines: LineRenderable[], matches: SearchMatch[], lowerTerm: string): SearchMatch[] {
  const parentMap = parentIndices(lines);
  const merged = new Map<number, SearchMatch>();

  for (const m of matches) {
    const parentIdx = parentMap[m.lineIndex];
    if (parentIdx !== null) {
      const parentTransMatch = !lines[parentIdx].skipTranslation &&
        lines[parentIdx].nodes.some((n) =>
          spansContainTerm(n, lowerTerm)
        );
      if (parentTransMatch) {
        const existing = merged.get(parentIdx);
        if (existing) {
          if (m.inSource) existing.inSource = true;
        } else {
          merged.set(parentIdx, { lineIndex: parentIdx, inSource: m.inSource, inTranslation: true });
        }
        continue;
      }
    }
    const existing = merged.get(m.lineIndex);
    if (existing) {
      if (m.inSource) existing.inSource = true;
      if (m.inTranslation) existing.inTranslation = true;
    } else {
      merged.set(m.lineIndex, { ...m });
    }
  }

  return [...merged.values()];
}

function spansContainTerm(node: DisplayNodeData, lowerTerm: string): boolean {
  return node.spans.some((s) => s.text.toLowerCase().includes(lowerTerm)) ||
    node.children.some((c) => spansContainTerm(c, lowerTerm));
}

export function computeMatches(lines: LineRenderable[], lowerTerm: string): SearchMatch[] {
  return lines
    .map((line, i) => {
      const inSource = line.sourceText.toLowerCase().includes(lowerTerm);
      const inTranslation = !line.skipTranslation && line.nodes.some((n) =>
        spansContainTerm(n, lowerTerm)
      );
      return { lineIndex: i, inSource, inTranslation };
    })
    .filter((m) => m.inSource || m.inTranslation);
}

function CodeTableInner({
  viewModel,
  fileName,
  targetSourceLine,
  targetTransLine,
  targetVar,
}: CodeTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sourcePct, setSourcePct] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [navHighlightLine, setNavHighlightLine] = useState<number | null>(null);

  const lines = viewModel.lines;
  const parentMap = useMemo(() => parentIndices(lines), [lines]);

  const rawSearchMatches: SearchMatch[] = useMemo(() => {
    if (!searchTerm) return [];
    return computeMatches(lines, searchTerm.toLowerCase());
  }, [lines, searchTerm]);

  const searchMatches: SearchMatch[] = useMemo(() => {
    if (!searchTerm) return [];
    return dedupMatches(lines, rawSearchMatches, searchTerm.toLowerCase());
  }, [lines, rawSearchMatches, searchTerm]);

  const rawNavVarMatches: SearchMatch[] = useMemo(() => {
    if (!targetVar) return [];
    return computeMatches(lines, targetVar.toLowerCase());
  }, [lines, targetVar]);

  const navVarMatches: SearchMatch[] = useMemo(() => {
    if (!targetVar) return [];
    return dedupMatches(lines, rawNavVarMatches, targetVar.toLowerCase());
  }, [lines, rawNavVarMatches, targetVar]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const markerWidth = 6;
      const lineNumWidth = 48;
      const resizerWidth = 4;
      const availableWidth = rect.width - markerWidth - lineNumWidth - resizerWidth;
      if (availableWidth <= 0) return;
      const x = e.clientX - rect.left - markerWidth - lineNumWidth;
      const pct = Math.max(20, Math.min(80, (x / availableWidth) * 100));
      setSourcePct(pct);
    };
    const handleMouseUp = () => setIsResizing(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen((prev) => {
          if (!prev) {
            setSearchTerm('');
            setActiveMatchIndex(0);
            setTimeout(() => searchInputRef.current?.focus(), 0);
          }
          return !prev;
        });
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchTerm('');
        setActiveMatchIndex(0);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    setActiveMatchIndex(0);
  }, [searchTerm]);

  const goToMatch = useCallback(
    (direction: 'next' | 'prev') => {
      if (searchMatches.length === 0) return;
      setActiveMatchIndex((prev) => {
        if (direction === 'next') return (prev + 1) % searchMatches.length;
        return (prev - 1 + searchMatches.length) % searchMatches.length;
      });
    },
    [searchMatches.length]
  );

  useEffect(() => {
    if (searchMatches.length === 0 || activeMatchIndex >= searchMatches.length)
      return;
    const match = searchMatches[activeMatchIndex];
    const line = viewModel.lines[match.lineIndex];
    if (!line) return;
    const row = containerRef.current?.querySelector(
      `[data-line="${line.lineNumber}"]`
    );
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeMatchIndex, searchMatches, viewModel]);

  useEffect(() => {
    if (!viewModel) return;
    const targetLine = targetSourceLine ?? targetTransLine;
    if (targetLine) {
      setNavHighlightLine(targetLine);
      const row = containerRef.current?.querySelector(
        `[data-line="${targetLine}"]`
      );
      row?.scrollIntoView({ behavior: 'instant', block: 'center' });
      const timer = setTimeout(() => setNavHighlightLine(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [viewModel, targetSourceLine, targetTransLine]);

  useEffect(() => {
    if (!viewModel || !targetVar || navVarMatches.length === 0) return;
    const firstMatch = navVarMatches[0];
    const line = viewModel.lines[firstMatch.lineIndex];
    const row = containerRef.current?.querySelector(
      `[data-line="${line.lineNumber}"]`
    );
    row?.scrollIntoView({ behavior: 'instant', block: 'center' });
  }, [viewModel, targetVar, navVarMatches]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-white">
      <div className="sticky top-0 z-10">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-3">
          <h3 className="font-semibold text-sm text-gray-700 truncate flex-1">
            {fileName}
          </h3>
          {isSearchOpen && (
            <div className="flex items-center gap-2 text-xs">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    goToMatch(e.shiftKey ? 'prev' : 'next');
                  }
                }}
                placeholder="Find in file..."
                className="w-48 px-2 py-1 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-blue-400"
              />
              <span className="text-gray-500 whitespace-nowrap">
                {searchMatches.length > 0
                  ? `${activeMatchIndex + 1}/${searchMatches.length}`
                  : searchTerm
                  ? 'No results'
                  : ''}
              </span>
              <button
                onClick={() => goToMatch('prev')}
                className={cx(
                  'px-1.5 py-0.5 rounded border border-gray-300 hover:bg-gray-200',
                  searchMatches.length === 0 && 'opacity-30'
                )}
                disabled={searchMatches.length === 0}
              >
                &#9650;
              </button>
              <button
                onClick={() => goToMatch('next')}
                className={cx(
                  'px-1.5 py-0.5 rounded border border-gray-300 hover:bg-gray-200',
                  searchMatches.length === 0 && 'opacity-30'
                )}
                disabled={searchMatches.length === 0}
              >
                &#9660;
              </button>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchTerm('');
                  setActiveMatchIndex(0);
                }}
                className="px-1.5 py-0.5 rounded border border-gray-300 hover:bg-gray-200 text-gray-500"
              >
                &#10005;
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        className="w-full font-mono text-sm"
        style={{
          display: 'grid',
          gridTemplateColumns: `6px 48px ${sourcePct}% 4px 20px 1fr`,
          gridAutoRows: 'auto',
          alignItems: 'start',
        }}
      >
        {viewModel.lines.map((line, i) => (
          <LineRow
            key={line.lineNumber}
            rowNum={i + 1}
            line={line}
            lineIndex={i}
            bucketStyle={BUCKET_STYLES[line.bucket]}
            isInterface={line.bucket === 'jsx'}
            onResizeStart={handleResizeStart}
            searchTerm={searchTerm}
            searchMatches={searchMatches}
            activeMatchIndex={activeMatchIndex}
            navVar={targetVar ?? undefined}
            parentRowIndex={parentMap[i]}
            isNavHighlight={
              navHighlightLine === line.lineNumber ||
              (targetVar !== null && targetVar !== undefined && navVarMatches.length > 0 &&
                (navVarMatches[0].lineIndex === i || parentMap[i] === navVarMatches[0].lineIndex))
            }
          />
        ))}
      </div>
      <HoverPopover />
    </div>
  );
}

export default function CodeTable(props: CodeTableProps) {
  return (
    <HoverProvider>
      <CodeTableInner {...props} />
    </HoverProvider>
  );
}
