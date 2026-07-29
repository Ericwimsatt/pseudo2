
import type { FolderBrowserFragmentData, HtmlFragment, FragmentKind } from './types';
import { escapeHtml, escapeAttribute } from './escaping';
import { createFragment, createMetadata } from './types';

export function renderFolderBrowser(data: FolderBrowserFragmentData): HtmlFragment {
  const { browseData, loading, error } = data;

  const metadata = createMetadata('folder-browser' as FragmentKind, {});

  let contentHtml = '';
  if (loading) {
    contentHtml = '<div class="text-center text-gray-500 py-8" data-role="loading">Loading...</div>';
  } else if (error) {
    contentHtml = `<div class="text-center text-red-500 py-8" data-role="error">${escapeHtml(error)}</div>`;
  } else if (browseData) {
    if (browseData.directories.length === 0) {
      contentHtml = '<div class="text-center text-gray-400 py-8" data-role="empty">No subdirectories</div>';
    } else {
      const dirsHtml = browseData.directories.map(dir => `
        <button
          data-role="directory-item"
          data-path="${escapeAttribute(dir.path)}"
          class="w-full text-left px-3 py-2 rounded hover:bg-blue-50 flex items-center gap-2 text-sm"
        >
          <span class="text-blue-500 text-base">📁</span>
          <span>${escapeHtml(dir.name)}</span>
        </button>
      `).join('');
      contentHtml = dirsHtml;
    }
  }

  const parentPath = browseData?.parentPath;
  const currentPath = browseData?.currentPath || '...';

  const html = `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-role="folder-browser-overlay">
      <div class="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col" data-role="folder-browser-modal">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 class="text-lg font-semibold">Select Folder</h2>
          <button class="text-gray-400 hover:text-gray-600 text-xl leading-none" data-role="close-button" aria-label="Close">&times;</button>
        </div>

        <div class="px-4 py-2 border-b border-gray-100">
          <div class="flex items-center gap-2 text-sm text-gray-600">
            ${parentPath ? `
              <button
                data-role="parent-directory"
                data-path="${escapeAttribute(parentPath)}"
                class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                .. Up
              </button>
            ` : ''}
            <span class="truncate font-mono text-xs">${escapeHtml(currentPath)}</span>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-2 py-2">
          ${contentHtml}
        </div>

        <div class="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            data-role="cancel-button"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            data-role="select-button"
            ${!browseData ? 'disabled' : ''}
          >
            Select This Folder
          </button>
        </div>
      </div>
    </div>
  `;

  return createFragment(html, metadata);
}