import { ipcMain } from 'electron';
import * as translationService from './translationService';

// MIGRATION BOUNDARY: This handler serves the React renderer.
// After React removal, delete this and use getFileFragment.
export function registerTranslationHandlers(): void {
  ipcMain.handle('loadFileTranslation', async (_event, arg: { path: string }) => {
    return translationService.loadFileTranslation(arg);
  });
}
