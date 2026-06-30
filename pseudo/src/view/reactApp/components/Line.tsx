import type { PseudoLine } from '../types';
import { useVsCodeApi } from '../hooks/vscodeHooks';

interface LineProps {
  line: PseudoLine;
}

/**
 * Renders a single pseudo line — the plain-English description of one
 * TypeScript statement.  Clicking the line asks the extension to
 * reveal the corresponding original source line.
 */
export function Line({ line }: LineProps) {
  const vscode = useVsCodeApi();

  const handleClick = () => {
    vscode.postMessage({ type: 'revealLine', lineNumber: line.lineNumber });
  };

  return (
    <div
      className="pseudo-line flex gap-3 px-3 py-2 cursor-pointer hover:bg-[var(--vscode-list-hoverBackground)] transition-colors group"
      onClick={handleClick}
      title="Click to reveal original source"
    >
      <span className="text-xs text-gray-500 mt-0.5 min-w-[2.5rem] text-right select-none tabular-nums">
        {line.lineNumber}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {line.pseudo}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-pre-wrap break-words">
          {line.original}
        </p>
      </div>
    </div>
  );
}
