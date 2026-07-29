import type { TooltipSection, SnippetLine, DisplayNodeData } from '../translationService/renderable/types';
import type { TooltipFragmentData, HtmlFragment, FragmentKind } from './types';
import { escapeHtml, escapeAttribute } from './escaping';
import { createFragment, createMetadata } from './types';

function escapeForDisplay(text: string): string {
  return escapeHtml(text);
}

function renderDisplayNode(node: DisplayNodeData): string {
  return node.spans.map(s => escapeForDisplay(s.text)).join('') +
    node.children.map(c => renderDisplayNode(c)).join('');
}

function renderPlainNodeLayer(nodes: DisplayNodeData[]): string {
  if (nodes.length === 0) {
    return '<span class="text-gray-300 italic">—</span>';
  }
  return nodes.map(node => `
    <span style="padding-left: ${node.indent * 12}px">
      ${renderDisplayNode(node)}
    </span>
  `).join('');
}

function renderSnippetBlock(snippet: SnippetLine[], filePath: string): string {
  return snippet.map(line => `
    <div class="flex items-start gap-1" data-line="${line.lineNumber}">
      <button
        class="text-blue-500 hover:text-blue-700 hover:underline cursor-pointer shrink-0 w-7 text-right leading-5"
        data-role="snippet-line-link"
        data-file-path="${escapeAttribute(filePath)}"
        data-line-number="${line.lineNumber}"
        title="Jump to line ${line.lineNumber}"
      >
        ${line.lineNumber}
      </button>
      <div class="min-w-0 leading-5">
        ${line.nodes.length > 0
          ? renderPlainNodeLayer(line.nodes)
          : `<span class="text-gray-400">${escapeForDisplay(line.sourceText)}</span>`
        }
      </div>
    </div>
  `).join('');
}

function renderDefinitionSection(section: Extract<TooltipSection, { type: 'definition' }>, filePath: string): string {
  return `
    <div class="mb-3" data-role="tooltip-definition" data-line="${section.line}">
      <button
        class="font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left"
        data-role="tooltip-definition-link"
        data-file-path="${escapeAttribute(filePath)}"
        data-line-number="${section.line}"
        title="Jump to line ${section.line}"
      >
        Definition (line ${section.line}):
      </button>
      <div class="font-mono text-xs border-l-2 border-gray-300 pl-2 my-1 space-y-0.5">
        ${renderSnippetBlock(section.snippet, filePath)}
      </div>
    </div>
  `;
}

function renderReferencesSection(section: Extract<TooltipSection, { type: 'references' }>): string {
  const itemsHtml = section.items.map((item, i) => {
    const fileName = item.filePath.split('/').pop() ?? item.filePath;
    return `
      <div data-role="tooltip-reference-item" data-index="${i}">
        ${i > 0 ? '<hr class="border-t border-gray-200 my-2" />' : ''}
        <button
          class="text-blue-600 hover:text-blue-800 hover:underline font-medium text-xs text-left"
          data-role="tooltip-reference-link"
          data-file-path="${escapeAttribute(item.filePath)}"
          data-line-number="${item.line}"
          title="Jump to ${fileName}:${item.line}"
        >
          ${fileName}:${item.line}
        </button>
        <div class="font-mono text-xs border-l-2 border-gray-300 pl-2 my-1 space-y-0.5">
          ${renderSnippetBlock(item.snippet, item.filePath)}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="mb-2" data-role="tooltip-references">
      <div class="font-semibold text-gray-800 mb-2">References:</div>
      ${itemsHtml}
    </div>
  `;
}

function renderTypeSection(section: Extract<TooltipSection, { type: 'type' }>): string {
  return `
    <div class="mb-1" data-role="tooltip-type">
      <span class="font-semibold text-gray-800">Type: </span>
      <span class="text-gray-600 font-mono">${escapeHtml(section.text)}</span>
    </div>
  `;
}

export function renderTooltip(data: TooltipFragmentData): HtmlFragment {
  const { title, body, sections = [], filePath = '' } = data;

  const metadata = createMetadata('tooltip' as FragmentKind, {});

  if (!title && !body && sections.length === 0) {
    const html = `
      <div class="text-sm max-w-md" data-role="tooltip-content" data-testid="tooltip-content">
        <div class="text-gray-400 text-xs italic">No information available</div>
      </div>
    `;
    return createFragment(html, metadata);
  }

  let titleHtml = '';
  if (title) {
    titleHtml = `<div class="font-semibold text-gray-900 mb-1" data-role="tooltip-title">${escapeHtml(title)}</div>`;
  }

  let bodyHtml = '';
  if (body) {
    bodyHtml = `<div class="text-gray-700 text-xs mb-2" data-role="tooltip-body">${escapeHtml(body)}</div>`;
  }

  const sectionsHtml = sections.map(section => {
    switch (section.type) {
      case 'definition':
        return renderDefinitionSection(section, filePath);
      case 'references':
        return renderReferencesSection(section);
      case 'type':
        return renderTypeSection(section);
    }
  }).join('');

  const html = `
    <div class="text-sm max-w-md" data-role="tooltip-content" data-testid="tooltip-content">
      ${titleHtml}
      ${bodyHtml}
      ${sectionsHtml}
    </div>
  `;

  return createFragment(html, metadata);
}