import * as vscode from 'vscode';
import { PseudoTranslator, PseudoLine } from '../controllers/PseudoTranslator';

/**
 * Custom editor provider for the "Pseudo View".
 *
 * When a `.ts` file is opened with this editor, `resolveCustomTextEditor` is
 * called.  It parses the file’s AST, builds a plain-English description for
 * every statement, and renders them inside a React-powered webview.
 *
 * @see https://code.visualstudio.com/api/extension-guides/custom-editors
 * @see https://code.visualstudio.com/api/extension-guides/webview
 */
export class PseudoEditorProvider implements vscode.CustomTextEditorProvider {
  private readonly _context: vscode.ExtensionContext;
  private readonly _translator = new PseudoTranslator();

  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  /**
   * Called when VS Code needs a `CustomDocument` for a given URI.
   * We store the raw text content on the document so the editor can
   * re-parse on changes.
   */
  async openCustomDocument(
    uri: vscode.Uri,
    _openContext: vscode.CustomDocumentOpenContext,
    _token: vscode.CancellationToken
  ): Promise<vscode.CustomDocument> {
    const content = (await vscode.workspace.fs.readFile(uri)).toString();
    return new PseudoCustomDocument(uri, content);
  }

  /**
   * Called after the webview panel has been created.  We set its HTML,
   * wire up message passing, and push the parsed pseudo data.
   *
   * @see https://code.visualstudio.com/api/extension-guides/custom-editors#custom-text-editor
   */
  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = this._generateHtml(webviewPanel.webview);

    this._sendUpdate(webviewPanel, document.getText());

    webviewPanel.webview.onDidReceiveMessage((msg) => {
      switch (msg.type) {
        case 'ready':
          this._sendUpdate(webviewPanel, document.getText());
          break;
        case 'revealLine':
          this._revealLine(document.uri, msg.lineNumber);
          break;
      }
    });

    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== document.uri.toString()) {
        return;
      }
      this._sendUpdate(webviewPanel, e.document.getText());
    });

    webviewPanel.onDidDispose(() => changeSub.dispose());
  }

  private _sendUpdate(panel: vscode.WebviewPanel, source: string) {
    const pseudoLines = this._translator.translate(source);
    panel.webview.postMessage({
      type: 'update',
      pseudoLines,
      sourceLines: source.split('\n'),
    });
  }

  private async _revealLine(uri: vscode.Uri, lineNumber: number) {
    const editor = await vscode.window.showTextDocument(uri, {
      viewColumn: vscode.ViewColumn.Beside,
      preserveFocus: true,
      selection: new vscode.Range(lineNumber - 1, 0, lineNumber - 1, 0),
    });
    editor.revealRange(
      new vscode.Range(lineNumber - 1, 0, lineNumber - 1, 0),
      vscode.TextEditorRevealType.InCenter
    );
  }

  /**
   * Builds the HTML that loads the React/Tailwind UI into the webview.
   * The bundled React app is served from `out/view/bundle.js`.
   */
  private _generateHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'out', 'view', 'bundle.js')
    );

    // Nonce for script integrity.
    const nonce = getNonce();

    return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none';
             style-src ${webview.cspSource} 'unsafe-inline' https://cdn.jsdelivr.net;
             script-src 'nonce-${nonce}';
             font-src ${webview.cspSource};
             img-src ${webview.cspSource} data:;">
  <link
    href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
    rel="stylesheet">
  <title>Pseudo View</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: var(--vscode-editor-font-size, 14px);
      background-color: var(--vscode-editor-background, #1e1e1e);
      color: var(--vscode-editor-foreground, #d4d4d4);
    }
    .pseudo-line {
      border-bottom: 1px solid var(--vscode-panel-border, #333);
    }
    .pseudo-line:last-child {
      border-bottom: none;
    }
    ::-webkit-scrollbar { width: 10px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-background, #424242);
      border-radius: 5px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: var(--vscode-scrollbarSlider-hoverBackground, #4f4f4f);
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

/**
 * Trivial `CustomDocument` holding the file URI and its latest text content.
 */
class PseudoCustomDocument implements vscode.CustomDocument {
  uri: vscode.Uri;
  content: string;

  constructor(uri: vscode.Uri, content: string) {
    this.uri = uri;
    this.content = content;
  }

  dispose() {}
}

function getNonce(): string {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 64; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
