import { ipcMain } from 'electron';
import * as projectSelectService from './projectSelectService';

export function registerProjectSelectHandlers(): void {
  ipcMain.handle('browseDirectory', async (_event, arg: { requestedPath?: string }) => {
    return projectSelectService.browseDirectory(arg?.requestedPath);
  });

  ipcMain.handle('openDirectorySelector', async () => {
    return projectSelectService.openDirectorySelector();
  });
}
