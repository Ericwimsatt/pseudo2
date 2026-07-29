import { ipcMain } from 'electron';
import * as projectSelectService from './projectSelectService';

// MIGRATION BOUNDARY: openDirectorySelector serves native dialogs only.
// After React removal, browseDirectory may also be deleted if getFolderBrowserFragment is used.
export function registerProjectSelectHandlers(): void {
  ipcMain.handle('browseDirectory', async (_event, arg: { requestedPath?: string }) => {
    return projectSelectService.browseDirectory(arg.requestedPath);
  });

  ipcMain.handle('openDirectorySelector', async () => {
    return projectSelectService.openDirectorySelector();
  });
}
