import { ipcMain } from 'electron';
import * as projectService from './projectService';

export function registerProjectHandlers(): void {
  ipcMain.handle('loadProject', async (_event, arg: { path: string }) => {
    return projectService.loadProject(arg.path);
  });

  ipcMain.handle('getTree', async () => {
    return projectService.getTree();
  });

  ipcMain.handle('uploadFolder', async (_event, arg: { files: { path: string; content: string }[] }) => {
    return projectService.uploadFolder(arg.files);
  });
}
