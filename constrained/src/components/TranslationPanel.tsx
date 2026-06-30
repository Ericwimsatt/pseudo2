interface TranslationPanelProps {
  translation: string[];
  fileName: string;
}

export default function TranslationPanel({ translation, fileName }: TranslationPanelProps) {
  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2">
        <h3 className="font-semibold text-sm text-gray-700">{fileName} - Translation</h3>
      </div>
      <div className="p-4 font-mono text-sm">
        {translation.map((line, index) => (
          <div key={index} className="py-1 whitespace-pre-wrap">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
