import { ipcMain } from 'electron';
import * as decorationService from './decorationService';

export function registerDecorationHandlers(): void {
  ipcMain.handle('getNodeDetail', async (_event, arg: { filePath: string; query: EnrichQuery }) => {
    return decorationService.getNodeDetail(arg);
  });
}
