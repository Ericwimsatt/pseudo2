import type { LineRenderable, LineBoxFragment, DisplayNodeData, DisplaySpan } from '../translationService/renderable/types';
import type { FileTableFragmentData, HtmlFragment, FragmentKind } from './types';
import { escapeHtml, escapeAttribute } from './escaping';
import { createFragment, createMetadata } from './types';
import { BUCKET_LABELS } from '../translationService/renderable/bucket';

const BORDER_COLORS = ['#93c5fd', '#86efac', '#fde68a'];
const BG_COLORS = ['#f0f9ff', '#f0fdf4', '#fffbeb'];

function renderSpans(spans: DisplaySpan[], searchTerm?: string, isActiveMatch = false): string {
  if (!searchTerm) {
    return spans.map(s => escapeHtml(s.text)).join('');
  }

  const termLower = searchTerm.toLowerCase();
  let result = '';

  for (const span of spans) {
    const text = span.text;
    const lower = text.toLowerCase();
    let lastIndex = 0;
    let index = lower.indexOf(termLower);

    while (index !== -1) {
      if (index > lastIndex) {
        result += escapeHtml(text.slice(lastIndex, index));
      }
      const matchText = text.slice(index, index + searchTerm.length);
      const markClass = isActiveMatch ? 'bg-yellow-300 text-black' : 'bg-yellow-100 text-black';
      result += `<mark class="rounded-sm ${markClass}">${escapeHtml(matchText)}</mark>`;
      lastIndex = index + searchTerm.length;
      index = lower.indexOf(termLower, lastIndex);
    }

    if (lastIndex < text.length) {
      result += escapeHtml(text.slice(lastIndex));
    }
  }

  return result;
}

function renderDisplayNode(node: DisplayNodeData, searchTerm?: string, isActiveMatch = false): string {
  const spansHtml = renderSpans(node.spans, searchTerm, isActiveMatch);
  const childrenHtml = node.children.map(c => renderDisplayNode(c, searchTerm, isActiveMatch)).join('');
  return `${spansHtml}${childrenHtml}`;
}

function renderBoxFragment(fragment: LineBoxFragment | null, searchTerm?: string): string {
  if (!fragment || (!fragment.layers.length && !fragment.contentNode)) {
    if (fragment?.contentNode) {
      return `
        <div class="whitespace-pre-wrap break-words font-mono text-sm px-4 py-1" data-role="box-content">
          ${renderDisplayNode(fragment.contentNode, searchTerm)}
        </div>
      `;
    }
    return '';
  }

  const maxDepth = fragment.layers.length > 0
    ? Math.max(...fragment.layers.map(l => l.depth))
    : 0;

  let content = fragment.contentNode
    ? `
      <div class="whitespace-pre-wrap break-words font-mono text-sm px-2 py-0.5" style="padding-left: ${maxDepth * 12}px" data-role="box-content">
        ${renderDisplayNode(fragment.contentNode, searchTerm)}
      </div>
    `
    : `<div class="select-none min-h-[1.25rem]">&ensp;</div>`;

  for (let i = fragment.layers.length - 1; i >= 0; i--) {
    const layer = fragment.layers[i];
    const color = BORDER_COLORS[layer.depth % BORDER_COLORS.length];
    const bg = BG_COLORS[layer.depth % BG_COLORS.length];
    const isStart = layer.borderRole === 'start' || layer.borderRole === 'single';
    const isEnd = layer.borderRole === 'end' || layer.borderRole === 'single';

    let borderRadius = '0';
    if (isStart && isEnd) borderRadius = '2px';
    else if (isStart) borderRadius = '2px 2px 0 0';
    else if (isEnd) borderRadius = '0 0 2px 2px';

    const marginLeft = layer.depth > 0 ? 16 : 0;

    content = `
      <div
        style="
          border-left: 2px solid ${color};
          border-top: ${isStart ? `2px solid ${color}` : 'none'};
          border-bottom: ${isEnd ? `2px solid ${color}` : 'none'};
          border-right: none;
          border-radius: ${borderRadius};
          background: ${bg};
          margin-left: ${marginLeft}px;
        "
        data-role="box-layer"
        data-depth="${layer.depth}"
        data-bucket="${layer.bucket}"
        data-border-role="${layer.borderRole}"
      >
        ${content}
      </div>
    `;
  }

  return content;
}

function renderLineRow(line: LineRenderable, rowNum: number, searchTerm?: string, targetVar?: string, selectionMode = 'both'): string {
  const showTranslation = line.boxFragment !== null;
  const effectiveSearchTerm = searchTerm || targetVar || '';
  const sourceHasTerm = effectiveSearchTerm && line.sourceText.toLowerCase().includes(effectiveSearchTerm.toLowerCase());

  const bucketLabel = BUCKET_LABELS[line.bucket] || 'standard';
  const isInterface = line.bucket === 'jsx';

  const bucketBorderHtml = `
    <div class="border-l-2 ${isInterface ? 'border-blue-500' : 'border-transparent'}" style="grid-row: ${rowNum}; grid-column: 1" data-role="bucket-border" data-bucket="${bucketLabel}"></div>
  `;

  const lineNumberHtml = `
    <div class="text-right pr-3 py-1 text-gray-400 select-none border-r border-gray-200 bg-gray-50 align-top font-mono text-xs" style="grid-row: ${rowNum}; grid-column: 2" data-role="line-number">
      ${line.lineNumber}
    </div>
  `;

  let sourceHtml = '';
  if (sourceHasTerm && effectiveSearchTerm) {
    sourceHtml = renderSpans(
      [{ text: line.sourceText }],
      effectiveSearchTerm,
      false
    );
  } else {
    sourceHtml = line.sourceText ? escapeHtml(line.sourceText) : '&nbsp;';
  }

  const sourceCellClass = `py-1 border-r border-gray-200 hover:bg-gray-50/40 transition-colors ${selectionMode === 'translation' ? 'select-none' : ''}`;
  const sourceCellHtml = `
    <div
      class="${sourceCellClass}"
      style="grid-row: ${rowNum}; grid-column: 3"
      data-bucket="${bucketLabel}"
      data-line="${line.lineNumber}"
      data-role="source-cell"
    >
      <div class="px-4 whitespace-pre-wrap break-words font-mono text-sm">${sourceHtml}</div>
    </div>
  `;

  const resizeHandleHtml = `
    <div
      class="cursor-col-resize bg-gray-100 hover:bg-blue-300 active:bg-blue-400 p-0 border-r border-gray-200"
      style="grid-row: ${rowNum}; grid-column: 4"
      data-role="resize-handle"
      data-row="${rowNum}"
    ></div>
  `;

  const spacerHtml = `<div style="grid-row: ${rowNum}; grid-column: 5" data-role="spacer"></div>`;

  let translationHtml = '';
  if (showTranslation) {
    const translationClass = selectionMode === 'source' ? 'select-none' : '';
    const boxHtml = renderBoxFragment(line.boxFragment!, effectiveSearchTerm);
    translationHtml = `
      <div class="${translationClass}" style="grid-row: ${rowNum}; grid-column: 6" data-role="translation-cell">
        <div data-role="translation-content" data-search-context='{"term": "${escapeAttribute(effectiveSearchTerm)}", "isActiveMatch": false}'>
          ${boxHtml}
        </div>
      </div>
    `;
  }

  return `${bucketBorderHtml}${lineNumberHtml}${sourceCellHtml}${resizeHandleHtml}${spacerHtml}${translationHtml}`;
}

export function renderFileTable(data: FileTableFragmentData): HtmlFragment {
  const { viewModel, fileName, filePath, targetSourceLine, targetTransLine, targetVar, sourcePct = 50 } = data;

  const linesHtml = viewModel.lines.map((line, i) => renderLineRow(
    line,
    i + 1,
    undefined,
    targetVar ?? undefined,
    'both'
  )).join('');

  const metadata = createMetadata('file-table' as FragmentKind, {
    route: `#/file/${encodeURIComponent(filePath)}`,
    filePath,
    lineNumber: targetSourceLine || targetTransLine || undefined,
  });

  const html = `
    <div class="flex-1 overflow-y-auto overflow-x-hidden bg-white" data-role="file-table" data-file-path="${escapeAttribute(filePath)}" data-source-pct="${sourcePct}">
      <div class="sticky top-0 z-10">
        <div class="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-3">
          <h3 class="font-semibold text-sm text-gray-700 truncate">
            ${escapeHtml(fileName || filePath)}
          </h3>
          <div class="flex items-center gap-1 text-xs ml-auto" data-role="selection-mode-controls">
            <button
              class="px-2 py-0.5 rounded border bg-blue-100 border-blue-300 text-blue-700"
              data-role="selection-mode-button"
              data-mode="source"
              title="Select source only (s)"
            >
              Src
            </button>
            <button
              class="px-2 py-0.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-200"
              data-role="selection-mode-button"
              data-mode="translation"
              title="Select translation only (t)"
            >
              Trans
            </button>
            <button
              class="px-2 py-0.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-200"
              data-role="selection-mode-button"
              data-mode="both"
              title="Select both (b)"
            >
              All
            </button>
          </div>
          <div class="hidden" data-role="search-controls" data-testid="search-controls">
            <input
              type="text"
              value=""
              placeholder="Find in file..."
              class="w-48 px-2 py-1 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:border-blue-400"
              data-role="search-input"
              data-testid="search-input"
            />
            <span class="text-gray-500 whitespace-nowrap" data-role="search-stats"></span>
            <button class="px-1.5 py-0.5 rounded border border-gray-300 hover:bg-gray-200 opacity-30" data-role="search-prev" disabled>&#9650;</button>
            <button class="px-1.5 py-0.5 rounded border border-gray-300 hover:bg-gray-200 opacity-30" data-role="search-next" disabled>&#9660;</button>
            <button class="px-1.5 py-0.5 rounded border border-gray-300 hover:bg-gray-200 text-gray-500" data-role="search-close">&#10005;</button>
          </div>
        </div>
      </div>
      <div
        class="w-full font-mono text-sm"
        style="display: grid; grid-template-columns: 6px 48px ${sourcePct}% 4px 20px 1fr;"
        data-role="code-grid"
        data-testid="code-grid"
      >
        ${linesHtml}
      </div>
      <div class="hidden" data-role="tooltip-container" data-testid="tooltip-container"></div>
    </div>
  `;

  return createFragment(html, metadata);
}