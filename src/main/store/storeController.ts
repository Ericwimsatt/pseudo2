import { ipcMain } from 'electron';
import {
  getLastProjectPath,
  setLastProjectPath,
  clearLastProjectPath,
  getLastFilePath,
  setLastFilePath,
  clearLastFilePath,
  getThemeId,
  setThemeId,
} from './appStore';
import { isThemeId } from '../themes';

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

  ipcMain.handle('get-theme', () => {
    return getThemeId();
  });

  ipcMain.handle('set-theme', (_event, value: string) => {
    if (isThemeId(value)) {
      setThemeId(value);
    }
  });
}
