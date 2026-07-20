import { ipcMain } from 'electron';
import * as translationService from './translationService';

export function registerTranslationHandlers(): void {
  ipcMain.handle('loadFileTranslation', async (_event, arg: { path: string }) => {
    return translationService.loadFileTranslation(arg);
  });
}
