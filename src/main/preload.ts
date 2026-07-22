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

  onMenuLoadFolder: (callback: (path: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, path: string) => callback(path);
    ipcRenderer.on('menu-load-folder', handler);
    return () => ipcRenderer.removeListener('menu-load-folder', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
