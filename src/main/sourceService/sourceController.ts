import { ipcMain } from 'electron';
import * as sourceService from './sourceService';

// MIGRATION BOUNDARY: This handler serves the React renderer.
// After React removal, delete this and use getFileFragment.
export function registerSourceHandlers(): void {
  ipcMain.handle('loadFileSource', async (_event, arg: { path: string }) => {
    return sourceService.loadFileSource(arg);
  });
}
