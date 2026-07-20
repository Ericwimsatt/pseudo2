import { ipcMain } from 'electron';
import * as sourceService from './sourceService';

export function registerSourceHandlers(): void {
  ipcMain.handle('loadFileSource', async (_event, arg: { path: string }) => {
    return sourceService.loadFileSource(arg);
  });
}
