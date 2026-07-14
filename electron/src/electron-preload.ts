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
  viewModel: {
    lines: Array<{
      lineNumber: number;
      sourceText: string;
      bucket: string;
      nodes: Array<{
        sourceStartLine: number;
        sourceEndLine: number;
        indent: number;
        bucket: string;
        tokens: Array<{
          text: string;
          variant?: string;
          classes?: string[];
          hover?: { title: string; body?: string; metadata?: Record<string, unknown> };
        }>;
        hover?: { title: string; body?: string; metadata?: Record<string, unknown> };
      }>;
      spanningBuckets: string[];
      translationRowSpan?: number;
      skipTranslation?: boolean;
    }>;
  };
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

  onMenuLoadFolder: (callback: (path: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, path: string) => callback(path);
    ipcRenderer.on('menu-load-folder', handler);
    return () => ipcRenderer.removeListener('menu-load-folder', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;
