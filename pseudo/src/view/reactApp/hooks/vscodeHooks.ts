/**
 * React hooks wrapping the VS Code webview messaging API.
 * Component authors never need to interact with `acquireVsCodeApi()` directly.
 *
 * @see https://code.visualstudio.com/api/extension-guides/webview#passing-messages-from-a-webview-to-an-extension
 */

import { useEffect, useCallback } from 'react';

interface VsCodeApi {
  postMessage(msg: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

let _api: VsCodeApi | null = null;

export function getVsCodeApi(): VsCodeApi {
  if (!_api) {
    _api = acquireVsCodeApi();
  }
  return _api;
}

/**
 * Returns the VS Code API handle.
 *
 * ```tsx
 * const vscode = useVsCodeApi();
 * vscode.postMessage({ type: 'hello' });
 * ```
 */
export function useVsCodeApi(): VsCodeApi {
  return getVsCodeApi();
}

/**
 * Listens for messages from the extension host.
 * Re-registers whenever `handler` identity changes.
 *
 * ```tsx
 * useMessageListener((msg) => {
 *   if (msg.type === 'update') { /* ... *\/ }
 * });
 * ```
 */
export function useMessageListener(
  handler: (message: any) => void
): void {
  useEffect(() => {
    const listener = (event: MessageEvent<any>) => {
      handler(event.data);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [handler]);
}
