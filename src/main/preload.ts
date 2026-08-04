import { contextBridge, ipcRenderer } from 'electron';
import type { ApiInvoke } from '../shared/api';

const api = {
  loadProject: (arg: ApiInvoke['loadProject']['arg']) =>
    ipcRenderer.invoke('loadProject', arg),

  getTree: () =>
    ipcRenderer.invoke('getTree', undefined),

  loadFileSource: (arg: ApiInvoke['loadFileSource']['arg']) =>
    ipcRenderer.invoke('loadFileSource', arg),

  loadFileTranslation: (arg: ApiInvoke['loadFileTranslation']['arg']) =>
    ipcRenderer.invoke('loadFileTranslation', arg),

  getNodeDetail: (arg: ApiInvoke['getNodeDetail']['arg']) =>
    ipcRenderer.invoke('getNodeDetail', arg),

  browseDirectory: (arg: ApiInvoke['browseDirectory']['arg']) =>
    ipcRenderer.invoke('browseDirectory', arg),

  uploadFolder: (arg: ApiInvoke['uploadFolder']['arg']) =>
    ipcRenderer.invoke('uploadFolder', arg),

  openDirectorySelector: () =>
    ipcRenderer.invoke('openDirectorySelector', undefined),

  getLastProjectPath: () =>
    ipcRenderer.invoke('get-last-project'),

  setLastProjectPath: (path: string) =>
    ipcRenderer.invoke('set-last-project', path),

  clearLastProjectPath: () =>
    ipcRenderer.invoke('clear-last-project'),

  getLastFilePath: () =>
    ipcRenderer.invoke('get-last-file'),

  setLastFilePath: (path: string) =>
    ipcRenderer.invoke('set-last-file', path),

  clearLastFilePath: () =>
    ipcRenderer.invoke('clear-last-file'),

  getTheme: () =>
    ipcRenderer.invoke('get-theme'),

  setTheme: (theme: string) =>
    ipcRenderer.invoke('set-theme', theme),

  // MIGRATION BOUNDARY: Fragment IPC methods below are the new htmx renderer surface.
  // Methods above are legacy React renderer endpoints and will be removed after cutover.
  loadProjectFragment: (arg: ApiInvoke['loadProjectFragment']['arg']) =>
    ipcRenderer.invoke('loadProjectFragment', arg),

  getSidebarFragment: (arg: ApiInvoke['getSidebarFragment']['arg']) =>
    ipcRenderer.invoke('getSidebarFragment', arg),

  getFileFragment: (arg: ApiInvoke['getFileFragment']['arg']) =>
    ipcRenderer.invoke('getFileFragment', arg),

  getTooltipFragment: (arg: ApiInvoke['getTooltipFragment']['arg']) =>
    ipcRenderer.invoke('getTooltipFragment', arg),

  getFolderBrowserFragment: (arg: ApiInvoke['getFolderBrowserFragment']['arg']) =>
    ipcRenderer.invoke('getFolderBrowserFragment', arg),

  getLandingPageFragment: () =>
    ipcRenderer.invoke('getLandingPageFragment', undefined),

  getLoadingFragment: (arg: ApiInvoke['getLoadingFragment']['arg']) =>
    ipcRenderer.invoke('getLoadingFragment', arg),

  onMenuLoadFolder: (callback: (path: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, path: string) => callback(path);
    ipcRenderer.on('menu-load-folder', handler);
    return () => ipcRenderer.removeListener('menu-load-folder', handler);
  },

  onMenuSetTheme: (callback: (theme: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, theme: string) => callback(theme);
    ipcRenderer.on('menu-set-theme', handler);
    return () => ipcRenderer.removeListener('menu-set-theme', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
