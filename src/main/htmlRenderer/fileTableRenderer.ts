import type { LineRenderable, LineBoxFragment, DisplayNodeData, DisplaySpan } from '../translationService/renderable/types';
import type { FileTableFragmentData, HtmlFragment, FragmentKind } from './types';
import { escapeHtml, escapeAttribute } from './escaping';
import { createFragment, createMetadata } from './types';
import { BUCKET_LABELS } from '../translationService/renderable/bucket';

const NEST_PALETTE_SIZE = 6;

const VARIANT_CLASSES: Partial<Record<NonNullable<DisplaySpan['variant']>, string>> = {
  kw: 'syntax-keyword',
  ident: 'syntax-identifier',
  'tag-name': 'syntax-tag',
  'attr-name': 'syntax-attribute',
  'attr-value': 'syntax-string',
  string: 'syntax-string',
  number: 'syntax-number',
  comment: 'syntax-comment',
  operator: 'syntax-operator',
  punct: 'syntax-punctuation',
  param: 'syntax-parameter',
  'fn-name': 'syntax-function',
};

function renderSpanText(text: string, searchTerm?: string, isActiveMatch = false): string {
  if (!searchTerm) return escapeHtml(text);

  const termLower = searchTerm.toLowerCase();
  const lower = text.toLowerCase();
  let result = '';
  let lastIndex = 0;
  let index = lower.indexOf(termLower);

  while (index !== -1) {
    if (index > lastIndex) result += escapeHtml(text.slice(lastIndex, index));
    const matchText = text.slice(index, index + searchTerm.length);
    const markClass = isActiveMatch ? 'bg-yellow-300 text-black' : 'bg-yellow-100 text-black';
    result += `<mark class="rounded-sm ${markClass}">${escapeHtml(matchText)}</mark>`;
    lastIndex = index + searchTerm.length;
    index = lower.indexOf(termLower, lastIndex);
  }

  if (lastIndex < text.length) result += escapeHtml(text.slice(lastIndex));
  return result;
}

function renderSpans(spans: DisplaySpan[], searchTerm?: string, isActiveMatch = false): string {
  return spans.map((span) => {
    const content = renderSpanText(span.text, searchTerm, isActiveMatch);
    const variantClass = span.variant ? VARIANT_CLASSES[span.variant] : undefined;
    const isHoverable = !!span.hasHover && (span.refPos !== undefined || span.hoverKind !== undefined);
    if (!variantClass && !isHoverable) return content;

    const classes = [
      'syntax-token',
      variantClass,
      isHoverable ? 'cursor-help underline decoration-dotted underline-offset-2' : undefined,
    ].filter(Boolean).join(' ');
    const refPosAttribute = isHoverable && span.refPos !== undefined ? ` data-refpos="${span.refPos}"` : '';
    const identifierAttribute = isHoverable ? ` data-hover-identifier="${escapeAttribute(span.text)}"` : '';
    const hoverKindAttribute = span.hoverKind ? ` data-hover-kind="${escapeAttribute(span.hoverKind)}"` : '';
    return `<span class="${classes}"${refPosAttribute}${identifierAttribute}${hoverKindAttribute}>${content}</span>`;
  }).join('');
}

function renderDisplayNode(node: DisplayNodeData, searchTerm?: string, isActiveMatch = false): string {
  const spansHtml = renderSpans(node.spans, searchTerm, isActiveMatch);
  const childrenHtml = node.children.map(c => renderDisplayNode(c, searchTerm, isActiveMatch)).join('');
  return `${spansHtml}${childrenHtml}`;
}

function renderBoxFragment(fragment: LineBoxFragment | null, searchTerm?: string): string {
  if (!fragment || (!fragment.layers.length && !fragment.contentNode)) {
    if (fragment?.contentNode) {
      return `<div class="whitespace-pre-wrap break-words font-mono text-sm px-4 py-1" data-role="box-content">${renderDisplayNode(fragment.contentNode, searchTerm)}</div>`;
    }
    return '';
  }

  const maxDepth = fragment.layers.length > 0
    ? Math.max(...fragment.layers.map(l => l.depth))
    : 0;

  // Visual indent step (px) shared by box-layer margins and content padding so
  // siblings line up regardless of whether the line introduces its own box.
  // Box-layer margins move the wrapping box one step per nesting depth, and
  // the content padding carries any EXTRA indent past the deepest wrapping
  // box (a child line whose own non-nested wrapper — e.g. `return expr` or
  // `x = value` — keeps the deepest box layer but logically sits deeper in
  // the tree). With both expressed in the same STEP, each indent level lands
  // exactly one column past its parent's header, giving a uniform visual
  // staircase without flattening siblings onto the parent's own column.
  const INDENT_STEP = 12;
  const contentIndent = fragment.contentNode?.indent ?? maxDepth;
  const paddingLeft = Math.max(0, contentIndent - maxDepth) * INDENT_STEP;

  let content = fragment.contentNode
    ? `<div class="whitespace-pre-wrap break-words font-mono text-sm px-2 py-0.5" style="padding-left: ${paddingLeft}px" data-role="box-content">${renderDisplayNode(fragment.contentNode, searchTerm)}</div>`
    : `<div class="select-none min-h-[1.25rem]">&ensp;</div>`;

  for (let i = fragment.layers.length - 1; i >= 0; i--) {
    const layer = fragment.layers[i];
    const nestIndex = layer.depth % NEST_PALETTE_SIZE;
    const color = `var(--nest-border-${nestIndex})`;
    const bg = `var(--nest-bg-${nestIndex})`;
    const isStart = layer.borderRole === 'start' || layer.borderRole === 'single';
    const isEnd = layer.borderRole === 'end' || layer.borderRole === 'single';

    let borderRadius = '0';
    if (isStart && isEnd) borderRadius = '2px';
    else if (isStart) borderRadius = '2px 2px 0 0';
    else if (isEnd) borderRadius = '0 0 2px 2px';

    const marginLeft = layer.depth > 0 ? INDENT_STEP : 0;

    content = `<div style="border-left: 2px solid ${color}; border-top: ${isStart ? `2px solid ${color}` : 'none'}; border-bottom: ${isEnd ? `2px solid ${color}` : 'none'}; border-right: none; border-radius: ${borderRadius}; background: ${bg}; margin-left: ${marginLeft}px;" data-role="box-layer" data-depth="${layer.depth}" data-bucket="${layer.bucket}" data-border-role="${layer.borderRole}">${content}</div>`;
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
    <div class="theme-linenum text-right pr-3 py-1 select-none border-r align-top font-mono text-xs" style="grid-row: ${rowNum}; grid-column: 2" data-role="line-number">
      ${line.lineNumber}
    </div>
  `;

  let sourceHtml = '';
  if (sourceHasTerm && effectiveSearchTerm) {
    sourceHtml = renderSpans(
      line.sourceSpans ?? [{ text: line.sourceText }],
      effectiveSearchTerm,
      false
    );
  } else {
    sourceHtml = line.sourceText ? renderSpans(line.sourceSpans ?? [{ text: line.sourceText }]) : '&nbsp;';
  }

  const sourceCellClass = `theme-source-cell py-1 border-r transition-colors ${selectionMode === 'translation' ? 'select-none' : ''}`;
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
      class="theme-resize cursor-col-resize hover:bg-blue-300 active:bg-blue-400 p-0 border-r"
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
    translationHtml = `<div class="${translationClass}" style="grid-row: ${rowNum}; grid-column: 6" data-role="translation-cell"><div data-role="translation-content" data-search-context='{"term": "${escapeAttribute(effectiveSearchTerm)}", "isActiveMatch": false}'>${boxHtml}</div></div>`;
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
    <div class="flex-1 overflow-y-auto overflow-x-hidden theme-surface" data-role="file-table" data-file-path="${escapeAttribute(filePath)}" data-source-pct="${sourcePct}">
      <div class="sticky top-0 z-10">
        <div class="theme-header border-b px-4 py-2 flex items-center gap-3">
          <h3 class="font-semibold text-sm truncate">
            ${escapeHtml(fileName || filePath)}
          </h3>
          <div class="flex items-center gap-1 text-xs ml-auto" data-role="selection-mode-controls">
            <button
              class="px-2 py-0.5 rounded border bg-blue-100 border-blue-300 text-blue-700"
              data-role="selection-mode-button"
              data-mode="source"
              aria-pressed="true"
              title="Select source only (s)"
            >
              Src
            </button>
            <button
              class="px-2 py-0.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-200"
              data-role="selection-mode-button"
              data-mode="translation"
              aria-pressed="false"
              title="Select translation only (t)"
            >
              Trans
            </button>
            <button
              class="px-2 py-0.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-200"
              data-role="selection-mode-button"
              data-mode="both"
              aria-pressed="false"
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
              class="theme-input w-48 px-2 py-1 border rounded text-sm font-mono focus:outline-none focus:border-blue-400"
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
