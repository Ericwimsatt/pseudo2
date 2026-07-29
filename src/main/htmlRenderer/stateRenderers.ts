import type { LoadingFragmentData, ErrorFragmentData, HtmlFragment, FragmentKind } from './types';
import { escapeHtml } from './escaping';
import { createFragment, createMetadata } from './types';

export function renderLoading(data: LoadingFragmentData): HtmlFragment {
  const { message } = data;

  const metadata = createMetadata('loading' as FragmentKind);
  const html = `
    <div class="flex-1 flex items-center justify-center text-gray-500" data-role="loading" data-testid="loading">
      ${escapeHtml(message || 'Loading...')}
    </div>
  `;

  return createFragment(html, metadata);
}

export function renderError(data: ErrorFragmentData): HtmlFragment {
  const { message } = data;

  const metadata = createMetadata('error' as FragmentKind);
  const html = `
    <div class="flex-1 flex items-center justify-center text-red-500" data-role="error" data-testid="error">
      Error: ${escapeHtml(message)}
    </div>
  `;

  return createFragment(html, metadata);
}

export function renderFilePlaceholder(data: { message: string }): HtmlFragment {
  const metadata = createMetadata('error' as FragmentKind);
  const html = `
    <div class="flex-1 flex items-center justify-center text-gray-500" data-role="file-placeholder" data-testid="file-placeholder">
      ${escapeHtml(data.message)}
    </div>
  `;

  return createFragment(html, metadata);
}