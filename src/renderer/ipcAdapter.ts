import type { HtmlFragmentResult } from '../shared/api';

let requestId = 0;
const latestRequest = new Map<string, number>();

interface LoadOptions {
  method: string;
  args: Record<string, unknown>;
  target: string | HTMLElement;
  swapStyle?: string;
  loadingMessage?: string;
  onSuccess?: (fragment: HtmlFragmentResult) => void;
  onError?: (error: unknown) => void;
}

function getTargetKey(el: string | HTMLElement): string {
  return typeof el === 'string' ? el : el.id || el.className || el.tagName;
}

function getTarget(el: string | HTMLElement): HTMLElement {
  if (typeof el === 'string') {
    const found = document.querySelector(el);
    if (!found) throw new Error(`Target not found: ${el}`);
    return found as HTMLElement;
  }
  return el;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return text.replace(/[&<>"']/g, ch => map[ch]);
}

export async function loadFragment(options: LoadOptions): Promise<HtmlFragmentResult | null> {
  const id = ++requestId;
  const targetKey = getTargetKey(options.target);
  latestRequest.set(targetKey, id);
  const target = getTarget(options.target);

  try {
    target.innerHTML = `<div class="flex items-center justify-center p-4 text-gray-500" data-role="loading">${escapeHtml(options.loadingMessage ?? 'Loading...')}</div>`;

    const api = (window as unknown as Record<string, unknown>).electronAPI as Record<string, (arg: unknown) => Promise<unknown>>;

    const result = await api[options.method]?.(options.args) as HtmlFragmentResult;
    if (!result || typeof result.html !== 'string') {
      throw new Error(`Invalid fragment response from ${options.method}`);
    }

    if (latestRequest.get(targetKey) !== id) {
      return null;
    }

    const htmx = (window as unknown as Record<string, unknown>).htmx as {
      swap: (el: HTMLElement, html: string, opts: Record<string, unknown>) => void;
      process: (el: HTMLElement) => void;
    };

    if (htmx?.swap) {
      htmx.swap(target, result.html, { swapStyle: options.swapStyle ?? 'innerHTML' });
    } else {
      target.innerHTML = result.html;
    }

    if (htmx?.process) {
      htmx.process(target);
    }

    options.onSuccess?.(result);
    return result;
  } catch (error) {
    if (latestRequest.get(targetKey) !== id) {
      return null;
    }
    const message = error instanceof Error ? error.message : String(error);
    target.innerHTML = `<div class="flex items-center justify-center p-4 text-red-500" data-role="error">${escapeHtml(message)}</div>`;
    options.onError?.(error);
    return null;
  }
}