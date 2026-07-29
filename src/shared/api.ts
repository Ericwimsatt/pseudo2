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

export type FragmentKind =
  | 'sidebar'
  | 'file-table'
  | 'folder-browser'
  | 'landing-page'
  | 'tooltip'
  | 'loading'
  | 'error';

export interface FragmentMetadata {
  kind: FragmentKind;
  route?: string;
  filePath?: string;
  lineNumber?: number;
  timestamp: number;
}

export interface HtmlFragmentResult {
  html: string;
  metadata: FragmentMetadata;
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
    arg: { filePath: string; query: EnrichQuery & { identifier?: string } };
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
  getLastProjectPath: {
    arg: undefined;
    return: string;
  };
  setLastProjectPath: {
    arg: string;
    return: void;
  };
  clearLastProjectPath: {
    arg: undefined;
    return: void;
  };
  getLastFilePath: {
    arg: undefined;
    return: string;
  };
  setLastFilePath: {
    arg: string;
    return: void;
  };
  clearLastFilePath: {
    arg: undefined;
    return: void;
  };
  loadProjectFragment: {
    arg: { path: string; selectedFile?: string | null; collapsed?: boolean };
    return: HtmlFragmentResult;
  };
  getSidebarFragment: {
    arg: { tree: FileNode[]; selectedFile: string | null; collapsed: boolean };
    return: HtmlFragmentResult;
  };
  getFileFragment: {
    arg: {
      filePath: string;
      targetSourceLine?: number | null;
      targetTransLine?: number | null;
      targetVar?: string | null;
      sourcePct?: number;
    };
    return: HtmlFragmentResult;
  };
  getTooltipFragment: {
    arg: { filePath: string; query: EnrichQuery & { identifier?: string } };
    return: HtmlFragmentResult;
  };
  getFolderBrowserFragment: {
    arg: { requestedPath?: string };
    return: HtmlFragmentResult;
  };
  getLandingPageFragment: {
    arg: undefined;
    return: HtmlFragmentResult;
  };
  getLoadingFragment: {
    arg: { message?: string };
    return: HtmlFragmentResult;
  };
}

export type ElectronAPI = {
  [K in keyof ApiInvoke]: ApiInvoke[K]['arg'] extends undefined
    ? () => Promise<ApiInvoke[K]['return']>
    : (
        arg: ApiInvoke[K]['arg']
      ) => Promise<ApiInvoke[K]['return']>;
} & {
  onMenuLoadFolder: (cb: (path: string) => void) => () => void;
};
