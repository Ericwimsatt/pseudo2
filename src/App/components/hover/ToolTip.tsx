import { useContext, useEffect, useRef, useState } from 'react';
import type { TooltipSection } from '../../../main/translationService/renderable/types';
import { FilePathContext } from '../../lib/filePathContext';
import { TooltipContent } from './TooltipContent';

interface Props {
  refPos?: number;
  filePath?: string;
  fallbackTitle?: string;
  fallbackBody?: string;
}

export function ToolTip({ refPos, filePath, fallbackTitle, fallbackBody }: Props) {
  const ctxFilePath = useContext(FilePathContext);
  const fp = filePath ?? ctxFilePath;
  const [sections, setSections] = useState<TooltipSection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState<string | undefined>(fallbackTitle);
  const askedRef = useRef(false);

  useEffect(() => {
    if (!refPos || !fp || askedRef.current) return;
    askedRef.current = true;
    setLoading(true);
    window.electronAPI.getNodeDetail({ filePath: fp, query: { refPos } })
      .then((answer) => {
        if (answer.title) setTitle(answer.title);
        setSections(answer.sections);
        setLoading(false);
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, [refPos, fp]);

  if (error) {
    return <div data-testid="tooltip-error">Error: {error}</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500" data-testid="tooltip-loading">
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Loading...</span>
      </div>
    );
  }

  if (sections) {
    return (
      <div data-testid="tooltip-sections">
        {title && <div className="font-semibold text-gray-800 mb-1">{title}</div>}
        <div className="max-h-80 overflow-y-auto">
          <TooltipContent sections={sections} />
        </div>
      </div>
    );
  }

  if (fallbackTitle) {
    return (
      <div data-testid="tooltip-static">
        <div className="font-semibold text-gray-800 mb-1">{fallbackTitle}</div>
        {fallbackBody && <div className="text-gray-600 whitespace-pre-wrap">{fallbackBody}</div>}
      </div>
    );
  }

  return null;
}
