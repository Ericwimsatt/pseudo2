import { ipcMain } from 'electron';
import {
  getLastProjectPath,
  setLastProjectPath,
  clearLastProjectPath,
  getLastFilePath,
  setLastFilePath,
  clearLastFilePath,
} from './appStore';

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

  ipcMain.handle('get-last-file', () => {
    return getLastFilePath();
  });

  ipcMain.handle('set-last-file', (_event, path: string) => {
    setLastFilePath(path);
  });

  ipcMain.handle('clear-last-file', () => {
    clearLastFilePath();
  });
}
