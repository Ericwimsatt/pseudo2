import { useNavigate } from 'react-router-dom';
import type { SnippetLine } from '../../../main/translationService/renderable/types';
import { PlainNodeLayer } from '../nodes/PlainNodeLayer';

interface Props {
  snippet: SnippetLine[];
  filePath: string;
  anchorLine: number;
}

export function TooltipSnippetBlock({ snippet, filePath }: Props) {
  const navigate = useNavigate();

  const handleLineClick = (lineNumber: number) => {
    navigate(`/file/${encodeURIComponent(filePath)}?sourceLine=${lineNumber}`);
  };

  return (
    <div className="font-mono text-xs border-l-2 border-gray-300 pl-2 my-1 space-y-0.5">
      {snippet.map((line) => (
        <div key={line.lineNumber} className="flex items-start gap-1">
          <button
            className="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer shrink-0 w-7 text-right leading-5"
            onClick={() => handleLineClick(line.lineNumber)}
            title={`Jump to line ${line.lineNumber}`}
          >
            {line.lineNumber}
          </button>
          <div className="min-w-0 leading-5">
            {line.nodes.length > 0 ? (
              <PlainNodeLayer nodes={line.nodes} />
            ) : (
              <span className="text-gray-400">{line.sourceText}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
