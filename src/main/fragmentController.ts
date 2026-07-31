import { ipcMain } from 'electron';
import type { FileNode } from '../shared/api';
import type { EnrichQuery } from './translationService/renderable/types';
import * as fragmentService from './fragmentService';

export function registerFragmentHandlers(): void {
  ipcMain.handle('loadProjectFragment', async (_event, arg: { path: string; selectedFile?: string | null; collapsed?: boolean; expandedDirs?: string[] }) => {
    return fragmentService.loadProjectAndRenderSidebar(arg.path, arg.selectedFile ?? null, arg.collapsed ?? false, arg.expandedDirs ?? []);
  });

  ipcMain.handle('getSidebarFragment', async (_event, arg: { tree: FileNode[]; selectedFile: string | null; collapsed: boolean; expandedDirs?: string[] }) => {
    return fragmentService.renderSidebarFromTree(arg.tree, arg.selectedFile, arg.collapsed, arg.expandedDirs ?? []);
  });

  ipcMain.handle('getFileFragment', async (_event, arg: {
    filePath: string;
    targetSourceLine?: number | null;
    targetTransLine?: number | null;
    targetVar?: string | null;
    sourcePct?: number;
  }) => {
    return fragmentService.renderFileFragment(arg.filePath, {
      targetSourceLine: arg.targetSourceLine,
      targetTransLine: arg.targetTransLine,
      targetVar: arg.targetVar,
      sourcePct: arg.sourcePct,
    });
  });

  ipcMain.handle('getTooltipFragment', async (_event, arg: { filePath: string; query: EnrichQuery & { identifier?: string } }) => {
    return fragmentService.renderTooltipFragment(arg.filePath, arg.query);
  });

  ipcMain.handle('getFolderBrowserFragment', async (_event, arg: { requestedPath?: string }) => {
    return fragmentService.renderFolderBrowserFragment(arg.requestedPath);
  });

  ipcMain.handle('getLandingPageFragment', async () => {
    return fragmentService.renderLandingPageFragment();
  });

  ipcMain.handle('getLoadingFragment', async (_event, arg: { message?: string }) => {
    return fragmentService.renderLoadingFragment(arg.message);
  });
}
