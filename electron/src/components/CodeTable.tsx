interface CodeTableProps {
  sourceCode: string;
  translationsByLine: Record<number, string[]>;
  fileName: string;
}

export default function CodeTable({ sourceCode, translationsByLine, fileName }: CodeTableProps) {
  const lines = sourceCode.split('\n');

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2">
        <h3 className="font-semibold text-sm text-gray-700">{fileName}</h3>
      </div>
      <table className="w-full font-mono text-sm border-collapse">
        <tbody>
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const translations = translationsByLine[lineNumber] ?? [];
            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="w-12 text-right pr-3 py-1 text-gray-400 select-none border-r border-gray-200 bg-gray-50 align-top">
                  {lineNumber}
                </td>
                <td className="px-4 py-1 whitespace-pre align-top border-r border-gray-200">{line}</td>
                <td className="px-4 py-1 align-top">
                  {translations.map((text, i) => (
                    <div key={i} className="whitespace-pre-wrap">{text}</div>
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
