import { ipcMain } from 'electron';
import { getLastProjectPath, setLastProjectPath, clearLastProjectPath } from './appStore';

export function registerStoreHandlers(): void {
  ipcMain.handle('get-last-project', () => {
    return getLastProjectPath();
  });

  ipcMain.handle('set-last-project', (_event, path: string) => {
    setLastProjectPath(path);
  });

  ipcMain.handle('clear-last-project', () => {
    clearLastProjectPath();
  });
}
