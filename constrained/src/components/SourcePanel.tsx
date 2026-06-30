interface SourcePanelProps {
  sourceCode: string;
  fileName: string;
}

export default function SourcePanel({ sourceCode, fileName }: SourcePanelProps) {
  const lines = sourceCode.split('\n');

  return (
    <div className="flex-1 overflow-auto bg-white border-r border-gray-200">
      <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2">
        <h3 className="font-semibold text-sm text-gray-700">{fileName}</h3>
      </div>
      <div className="font-mono text-sm">
        {lines.map((line, index) => (
          <div key={index} className="flex hover:bg-gray-50">
            <div className="w-12 text-right pr-3 py-1 text-gray-400 select-none border-r border-gray-200 bg-gray-50">
              {index + 1}
            </div>
            <div className="flex-1 px-4 py-1 whitespace-pre">{line}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
