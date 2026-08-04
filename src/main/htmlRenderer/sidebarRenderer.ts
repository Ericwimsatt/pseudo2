import type { FileNode } from '../../shared/api';
import type { SidebarFragmentData, HtmlFragment, FragmentKind } from './types';
import { escapeHtml, escapeAttribute } from './escaping';
import { createFragment, createMetadata } from './types';

const FOLDER_TOGGLE_OPEN = '▾';
const FOLDER_TOGGLE_CLOSED = '▸';
const COLLAPSE_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10 4l-4 4 4 4V4z" /></svg>`;
const EXPAND_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 4l4 4-4 4V4z" /></svg>`;

function renderFileNode(node: FileNode, selectedFile: string | null, depth: number): string {
  const isSelected = selectedFile === node.path;
  const paddingLeft = depth * 12 + 20;
  const selectedClass = isSelected ? 'bg-blue-100 text-blue-900' : 'hover:bg-blue-50';
  const baseClass = 'w-full text-left px-2 py-1 text-sm transition-colors';
  const dataAttrs = `data-path="${escapeAttribute(node.path)}" data-role="sidebar-file" data-depth="${depth}"`;

  return `<button ${dataAttrs} class="${baseClass} ${selectedClass}" style="padding-left: ${paddingLeft}px" title="${escapeAttribute(node.path)}">${escapeHtml(node.name)}</button>`;
}

function renderDirectoryNode(node: FileNode, selectedFile: string | null, depth: number, expandedDirs: string[]): string {
  const isOpen = expandedDirs.includes(node.path);
  const paddingLeft = depth * 12 + 8;
  const toggleIcon = isOpen ? FOLDER_TOGGLE_OPEN : FOLDER_TOGGLE_CLOSED;
  const dataAttrs = `data-path="${escapeAttribute(node.path)}" data-role="sidebar-directory" data-depth="${depth}" data-open="${isOpen}"`;

  let childrenHtml = '';
  if (node.children) {
    childrenHtml = node.children.map(child => {
      if (child.type === 'directory') {
        return renderDirectoryNode(child, selectedFile, depth + 1, expandedDirs);
      }
      return renderFileNode(child, selectedFile, depth + 1);
    }).join('');
  }

  const childrenContainer = childrenHtml
    ? `<div data-role="sidebar-children"${isOpen ? '' : ' style="display: none"'}>${childrenHtml}</div>`
    : '';

  return `
    <div ${dataAttrs} style="padding-left: ${paddingLeft}px">
      <button class="w-full text-left px-2 py-1 hover:bg-gray-100 flex items-center gap-1 text-sm transition-colors" data-action="toggle-directory" aria-expanded="${isOpen}">
        <span class="sidebar-chevron ${isOpen ? 'is-open' : ''}" data-role="sidebar-toggle-icon" aria-hidden="true">${toggleIcon}</span>
        <span class="font-medium">${escapeHtml(node.name)}</span>
      </button>
      ${childrenContainer}
    </div>
  `;
}

export function renderSidebar(data: SidebarFragmentData): HtmlFragment {
  const { tree, selectedFile, collapsed } = data;
  const expandedDirs = data.expandedDirs ?? [];

  if (collapsed) {
    const metadata = createMetadata('sidebar' as FragmentKind, { route: '#/' });
    const html = `
      <div class="w-10 bg-gray-50 border-r border-gray-200 h-screen flex flex-col items-center pt-3 flex-shrink-0" data-role="sidebar" data-collapsed="true">
        <button class="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors" data-action="expand-sidebar" title="Expand sidebar" aria-label="Expand sidebar">
          ${EXPAND_SVG}
        </button>
      </div>
    `;
    return createFragment(html, metadata);
  }

  const itemsHtml = tree.map(node => {
    if (node.type === 'directory') {
      return renderDirectoryNode(node, selectedFile, 0, expandedDirs);
    }
    return renderFileNode(node, selectedFile, 0);
  }).join('');

  const metadata = createMetadata('sidebar' as FragmentKind, { route: '#/' });
  const html = `
    <div class="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto h-screen flex-shrink-0 flex flex-col" data-role="sidebar" data-collapsed="false">
      <div class="p-3 border-b border-gray-200 flex items-center justify-between">
        <h2 class="font-semibold text-sm text-gray-700">Files</h2>
        <button class="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-200 transition-colors" data-action="collapse-sidebar" title="Collapse sidebar" aria-label="Collapse sidebar">
          ${COLLAPSE_SVG}
        </button>
      </div>
      <div class="py-2 flex-1 overflow-y-auto">
        ${itemsHtml}
      </div>
    </div>
  `;

  return createFragment(html, metadata);
}
