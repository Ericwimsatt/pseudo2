import { contextBridge, ipcRenderer } from 'electron';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

interface BrowseResult {
  currentPath: string;
  parentPath: string | null;
  directories: { name: string; path: string }[];
}

interface FileResult {
  sourceCode: string;
  translationsByLine: Record<number, string[]>;
  path: string;
}

const api = {
  loadRepo: (path: string): Promise<{ tree: FileNode[]; path: string }> =>
    ipcRenderer.invoke('load-repo', path),

  getTree: (): Promise<{ tree: FileNode[] }> =>
    ipcRenderer.invoke('get-tree'),

  getFile: (path: string): Promise<FileResult> =>
    ipcRenderer.invoke('get-file', path),

  browseDirectory: (path?: string): Promise<BrowseResult> =>
    ipcRenderer.invoke('browse-directory', path),

  uploadFolder: (files: { path: string; content: string }[]): Promise<{ tree: FileNode[]; path: string }> =>
    ipcRenderer.invoke('upload-folder', files),

  dialogOpenDirectory: (): Promise<string | null> =>
    ipcRenderer.invoke('dialog-open-directory'),
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
