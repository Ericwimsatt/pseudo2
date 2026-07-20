import type { ViewModel, EnrichQuery, QueryAnswer } from '../main/translationService/renderable/types';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface BrowseResult {
  currentPath: string;
  parentPath: string | null;
  directories: { name: string; path: string }[];
}

export interface SourceLine {
  lineNumber: number;
  text: string;
}

export interface ApiInvoke {
  loadProject: {
    arg: { path: string };
    return: { tree: FileNode[]; path: string };
  };
  getTree: {
    arg: undefined;
    return: { tree: FileNode[] };
  };
  loadFileSource: {
    arg: { path: string };
    return: { path: string; lines: SourceLine[] };
  };
  loadFileTranslation: {
    arg: { path: string };
    return: { path: string; viewModel: ViewModel };
  };
  getNodeDetail: {
    arg: { filePath: string; query: EnrichQuery };
    return: QueryAnswer;
  };
  browseDirectory: {
    arg: { requestedPath?: string };
    return: BrowseResult;
  };
  uploadFolder: {
    arg: { files: { path: string; content: string }[] };
    return: { tree: FileNode[]; path: string };
  };
  openDirectorySelector: {
    arg: undefined;
    return: string | null;
  };
}

export type ElectronAPI = {
  [K in keyof ApiInvoke]: (
    arg: ApiInvoke[K]['arg']
  ) => Promise<ApiInvoke[K]['return']>;
} & {
  onMenuLoadFolder: (cb: (path: string) => void) => () => void;
};
