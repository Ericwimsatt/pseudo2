import * as vscode from 'vscode';
import { PseudoEditorProvider } from './providers/PseudoEditorProvider';

/**
 * Activated when a `.ts` file is opened or the `pseudo.open` command is invoked.
 * Registers the custom editor provider and the open-pseudo command.
 *
 * @see https://code.visualstudio.com/api/references/activation-events
 * @see https://code.visualstudio.com/api/extension-guides/custom-editors
 */
export function activate(context: vscode.ExtensionContext) {
  const provider = new PseudoEditorProvider(context);

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'pseudo.pseudoEditor',
      provider,
      {
        supportsMultipleEditorsPerDocument: false,
      }
    )
  );

  const openPseudoCommand = vscode.commands.registerCommand(
    'pseudo.open',
    async (uri?: vscode.Uri) => {
      const targetUri =
        uri ?? vscode.window.activeTextEditor?.document.uri;

      if (!targetUri) {
        vscode.window.showWarningMessage('No TypeScript file to open.');
        return;
      }

      await vscode.commands.executeCommand(
        'vscode.openWith',
        targetUri,
        'pseudo.pseudoEditor'
      );
    }
  );

  context.subscriptions.push(openPseudoCommand);
}

export function deactivate() {}
