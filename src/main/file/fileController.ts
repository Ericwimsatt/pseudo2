import { ipcMain } from 'electron';
import * as fileService from './fileService';

export function registerFileHandlers(): void {
  ipcMain.handle('loadFileSource', async (_event, arg: { path: string }) => {
    return fileService.loadFileSource(arg);
  });

  ipcMain.handle('loadFileTranslation', async (_event, arg: { path: string }) => {
    return fileService.loadFileTranslation(arg);
  });
}
