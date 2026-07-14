import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { SemanticNode } from '../lib/makeSemanticGraph';
import { buildViewModel } from '../lib/renderable/viewModel';
import { BUCKET_STYLES } from '../lib/renderable/bucket';
import { HoverProvider } from './HoverContext';
import { HoverContext } from './useHover';
import { LineRow } from './LineRow';
import { HoverPopover } from './HoverPopover';

export interface SemanticNodeDto {
  type: string;
  name?: string;
  children: SemanticNodeDto[];
  metadata: Record<string, any>;
  indent: number;
  sourceStartLine: number;
  sourceEndLine: number;
}

interface CodeTableProps {
  sourceCode: string;
  semanticNodes: SemanticNodeDto[];
  fileName: string;
}

function CodeTableInner({
  sourceCode,
  semanticNodes,
  fileName,
}: CodeTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sourcePct, setSourcePct] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  const viewModel = useMemo(
    () => buildViewModel(semanticNodes as unknown as SemanticNode[], sourceCode),
    [semanticNodes, sourceCode]
  );

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

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden bg-white">
      <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 z-10">
        <h3 className="font-semibold text-sm text-gray-700 truncate">{fileName}</h3>
      </div>
      <table
        className="w-full font-mono text-sm border-collapse"
        style={{ tableLayout: 'fixed' }}
      >
        <colgroup>
          <col style={{ width: 6 }} />
          <col style={{ width: 48 }} />
          <col style={{ width: `${sourcePct}%` }} />
          <col style={{ width: 4 }} />
          <col />
        </colgroup>
        <tbody>
          {viewModel.lines.map((line) => (
            <LineRow
              key={line.lineNumber}
              line={line}
              bucketStyle={BUCKET_STYLES[line.bucket]}
              isInterface={line.bucket === 'jsx'}
              onResizeStart={handleResizeStart}
              sourcePct={sourcePct}
            />
          ))}
        </tbody>
      </table>
      <HoverPopover />
    </div>
  );
}

export default function CodeTable(props: CodeTableProps) {
  return (
    <HoverProvider context={HoverContext}>
      <CodeTableInner {...props} />
    </HoverProvider>
  );
}
