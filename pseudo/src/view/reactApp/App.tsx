import { useState } from 'react';
import { useMessageListener } from './hooks/vscodeHooks';
import { Line } from './components/Line';
import type { PseudoLine, UpdateMessage } from './types';

export function App() {
  const [pseudoLines, setPseudoLines] = useState<PseudoLine[]>([]);
  const [sourceLines, setSourceLines] = useState<string[]>([]);

  useMessageListener((msg: UpdateMessage) => {
    if (msg.type === 'update') {
      setPseudoLines(msg.pseudoLines);
      setSourceLines(msg.sourceLines);
    }
  });

  if (pseudoLines.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-sm">
          Open a TypeScript file to see its Pseudo view.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4">
      <h2 className="text-lg font-semibold px-3 mb-3 text-[var(--vscode-foreground)]">
        Pseudo
      </h2>
      {pseudoLines.map((line, i) => (
        <Line key={i} line={line} />
      ))}
      <div className="py-8 text-center text-xs text-gray-500">
        {pseudoLines.length} statement{pseudoLines.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
