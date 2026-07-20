import type { EnrichQuery, QueryAnswer, SnippetLine, TooltipSection } from '../translationService/renderable/types';
import { getCache } from '../translationService/cache/projectCache';

function extractSnippet(lines: { lineNumber: number; sourceText: string; nodes: import('../translationService/renderable/types').DisplayNodeData[] }[], anchorLine: number): SnippetLine[] {
  const snippet: SnippetLine[] = [];
  for (let offset = -1; offset <= 2; offset++) {
    const targetLine = anchorLine + offset;
    const found = lines.find((l) => l.lineNumber === targetLine);
    if (found) {
      snippet.push({
        lineNumber: found.lineNumber,
        sourceText: found.sourceText,
        nodes: found.nodes,
      });
    }
  }
  return snippet;
}

export function getNodeDetail(arg: { filePath: string; query: EnrichQuery }): QueryAnswer {
  const cache = getCache(arg.filePath);
  if (!cache) {
    return { sections: [] };
  }
  const { astCache, viewModel } = cache;
  const refPos = arg.query.refPos;
  const sections: TooltipSection[] = [];
  const allLines = viewModel.lines;

  // Definition
  const def = astCache.getDefinition(refPos);
  if (def) {
    const snippet = extractSnippet(allLines, def.line);
    sections.push({ type: 'definition', line: def.line, snippet });
  }

  // References
  const refs = astCache.getReferences(refPos);
  if (refs.length > 0) {
    const items = refs.map((r) => ({
      line: r.line,
      filePath: arg.filePath,
      snippet: extractSnippet(allLines, r.line),
    }));
    sections.push({ type: 'references', items });
  }
  // Type
  const typeData = astCache.getType(refPos);
  if (typeData) {
    sections.push({ type: 'type', text: typeData.text });
  }

  return { sections };
}
