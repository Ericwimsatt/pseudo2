import type { LandingPageFragmentData, HtmlFragment, FragmentKind } from './types';
import { escapeHtml } from './escaping';
import { createFragment, createMetadata } from './types';

export function renderLandingPage(data: LandingPageFragmentData): HtmlFragment {
  const { loading, loadError } = data;

  const metadata = createMetadata('landing-page' as FragmentKind);
  const html = `
    <div class="min-h-screen flex items-center justify-center bg-gray-50" data-role="landing-page" data-testid="landing-page">
      <div class="bg-white p-8 rounded-lg shadow-md w-[480px]">
        <h1 class="text-2xl font-bold mb-6">Load Repository</h1>
        ${loadError ? `
          <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm" data-role="load-error" data-testid="load-error">
            ${escapeHtml(loadError)}
          </div>
        ` : ''}

        <button
          class="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors mb-4 flex items-center justify-center gap-2"
          data-role="browse-button"
          data-testid="browse-button"
        >
          <span class="text-lg">📂</span>
          <span>Browse for a folder...</span>
        </button>

        <div class="flex items-center gap-3 my-4">
          <div class="flex-1 h-px bg-gray-200" />
          <span class="text-xs text-gray-400 uppercase">or drag & drop</span>
          <div class="flex-1 h-px bg-gray-200" />
        </div>

        <div
          class="w-full py-10 border-2 border-dashed rounded-lg text-center transition-colors ${loading ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 text-gray-400'}"
          data-role="drop-zone"
          data-testid="drop-zone"
        >
          ${loading ? `
            <p>Processing folder...</p>
          ` : `
            <p class="text-3xl mb-2">📁</p>
            <p>Drop a folder here</p>
          `}
        </div>

        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden" data-role="folder-browser-modal" data-testid="folder-browser-modal">
          <div class="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 class="text-lg font-semibold">Select Folder</h2>
              <button class="text-gray-400 hover:text-gray-600 text-xl leading-none" data-role="close-folder-browser" aria-label="Close folder browser">&times;</button>
            </div>
            <div class="px-4 py-2 border-b border-gray-100">
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <span class="truncate font-mono text-xs" data-role="folder-browser-path">...</span>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto px-2 py-2" data-role="folder-browser-list">
              <div class="text-center text-gray-500 py-8">Loading...</div>
            </div>
            <div class="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800" data-role="folder-browser-cancel">Cancel</button>
              <button class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400" data-role="folder-browser-select" disabled>Select This Folder</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  return createFragment(html, metadata);
}