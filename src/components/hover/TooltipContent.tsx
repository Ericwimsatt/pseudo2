import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import type { TooltipSection } from '../../lib/renderable/types';
import { TooltipSnippetBlock } from './TooltipSnippetBlock';
import { FilePathContext } from '../../lib/filePathContext';

interface Props {
  sections: TooltipSection[];
}

function DefinitionSection({ section }: { section: Extract<TooltipSection, { type: 'definition' }> }) {
  const navigate = useNavigate();
  const filePath = useContext(FilePathContext);

  return (
    <div className="mb-3">
      <button
        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left"
        onClick={() => navigate(`/file/${encodeURIComponent(filePath)}?sourceLine=${section.line}`)}
        title={`Jump to line ${section.line}`}
      >
        Definition (line {section.line}):
      </button>
      <TooltipSnippetBlock snippet={section.snippet} filePath={filePath} anchorLine={section.line} />
    </div>
  );
}

function ReferencesSection({ section }: { section: Extract<TooltipSection, { type: 'references' }> }) {
  const navigate = useNavigate();

  return (
    <div className="mb-2">
      <div className="font-semibold text-gray-800 mb-2">References:</div>
      {section.items.map((item, i) => {
        const fileName = item.filePath.split('/').pop() ?? item.filePath;
        return (
          <div key={i}>
            {i > 0 && <hr className="border-t border-gray-200 my-2" />}
            <button
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs text-left"
              onClick={() => navigate(`/file/${encodeURIComponent(item.filePath)}?sourceLine=${item.line}`)}
              title={`Jump to ${fileName}:${item.line}`}
            >
              {fileName}:{item.line}
            </button>
            <TooltipSnippetBlock snippet={item.snippet} filePath={item.filePath} anchorLine={item.line} />
          </div>
        );
      })}
    </div>
  );
}

function TypeSection({ section }: { section: Extract<TooltipSection, { type: 'type' }> }) {
  return (
    <div className="mb-1">
      <span className="font-semibold text-gray-800">Type: </span>
      <span className="text-gray-600 font-mono">{section.text}</span>
    </div>
  );
}

function SectionRenderer({ section }: { section: TooltipSection }) {
  switch (section.type) {
    case 'definition':
      return <DefinitionSection section={section} />;
    case 'references':
      return <ReferencesSection section={section} />;
    case 'type':
      return <TypeSection section={section} />;
  }
}

export function TooltipContent({ sections }: Props) {
  if (sections.length === 0) {
    return <div className="text-gray-400 text-xs italic">No information available</div>;
  }

  return (
    <div className="text-sm max-w-md">
      {sections.map((section, i) => (
        <SectionRenderer key={i} section={section} />
      ))}
    </div>
  );
}
