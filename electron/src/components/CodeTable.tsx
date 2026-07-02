import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface TranslationItem {
  text: string;
  endLine: number;
}

interface CodeTableProps {
  sourceCode: string;
  translationsByLine: Record<number, TranslationItem[]>;
  fileName: string;
}

export default function CodeTable({ sourceCode, translationsByLine, fileName }: CodeTableProps) {
  const lines = sourceCode.split('\n');
  const containerRef = useRef<HTMLDivElement>(null);
  const [sourcePct, setSourcePct] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

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
      const lineNumWidth = 48;
      const resizerWidth = 4;
      const availableWidth = rect.width - lineNumWidth - resizerWidth;
      if (availableWidth <= 0) return;
      const x = e.clientX - rect.left - lineNumWidth;
      const pct = Math.max(20, Math.min(80, (x / availableWidth) * 100));
      setSourcePct(pct);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

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

  const { rowSpans, skipSet } = useMemo(() => {
    const rowSpans: Record<number, number> = {};
    const skipSet = new Set<number>();

    const translationLines = Object.keys(translationsByLine)
      .map(Number)
      .sort((a, b) => a - b);

    for (const line of translationLines) {
      const items = translationsByLine[line];
      if (!items || items.length === 0) continue;
      const maxEndLine = Math.max(...items.map((item) => item.endLine));
      if (maxEndLine <= line) continue;

      let hasOverlap = false;
      for (let i = line + 1; i <= maxEndLine; i++) {
        if (translationsByLine[i] && translationsByLine[i].length > 0) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap && maxEndLine > line) {
        rowSpans[line] = maxEndLine - line + 1;
        for (let i = line + 1; i <= maxEndLine; i++) {
          skipSet.add(i);
        }
      }
    }

    return { rowSpans, skipSet };
  }, [translationsByLine]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-white">
      <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 z-10">
        <h3 className="font-semibold text-sm text-gray-700 truncate">{fileName}</h3>
      </div>
      <table className="w-full font-mono text-sm border-collapse" style={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: 48 }} />
          <col style={{ width: `${sourcePct}%` }} />
          <col style={{ width: 4 }} />
          <col />
        </colgroup>
        <tbody>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            if (skipSet.has(lineNumber)) {
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="text-right pr-3 py-1 text-gray-400 select-none border-r border-gray-200 bg-gray-50 align-top">
                    {lineNumber}
                  </td>
                  <td className="py-1 align-top border-r border-gray-200">
                    <div className="px-4 whitespace-pre overflow-x-auto">{line}</div>
                  </td>
                  <td
                    className="cursor-col-resize bg-gray-100 hover:bg-blue-300 active:bg-blue-400 p-0 align-top border-r border-gray-200"
                    onMouseDown={handleResizeStart}
                  />
                </tr>
              );
            }
            const translations = translationsByLine[lineNumber] ?? [];
            const rowSpan = rowSpans[lineNumber] || 1;
            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="text-right pr-3 py-1 text-gray-400 select-none border-r border-gray-200 bg-gray-50 align-top">
                  {lineNumber}
                </td>
                <td className="py-1 align-top border-r border-gray-200">
                  <div className="px-4 whitespace-pre overflow-x-auto">{line}</div>
                </td>
                <td
                  className="cursor-col-resize bg-gray-100 hover:bg-blue-300 active:bg-blue-400 p-0 align-top border-r border-gray-200"
                  onMouseDown={handleResizeStart}
                />
                <td className="px-4 py-1 align-top" rowSpan={rowSpan > 1 ? rowSpan : undefined}>
                  {translations.map((text, i) => (
                    <div key={i} className="whitespace-pre-wrap break-words">{text.text}</div>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
