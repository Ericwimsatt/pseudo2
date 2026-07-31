import type { FileNode, BrowseResult } from '../../shared/api';
import type { ViewModel, TooltipData } from '../translationService/renderable/types';

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

export interface HtmlFragment {
  html: string;
  metadata: FragmentMetadata;
}

export interface SidebarFragmentData {
  tree: FileNode[];
  selectedFile: string | null;
  collapsed: boolean;
  expandedDirs?: string[];
}

export interface FileTableFragmentData {
  viewModel: ViewModel;
  fileName: string;
  filePath: string;
  targetSourceLine?: number | null;
  targetTransLine?: number | null;
  targetVar?: string | null;
  sourcePct?: number;
}

export interface FolderBrowserFragmentData {
  browseData: BrowseResult | null;
  loading: boolean;
  error: string | null;
}

export interface LandingPageFragmentData {
  loading: boolean;
  loadError: string | null;
}

export interface TooltipFragmentData {
  title?: string;
  body?: string;
  sections?: TooltipData['sections'];
  filePath?: string;
  anchorSelector?: string;
}

export interface LoadingFragmentData {
  message: string;
}

export interface ErrorFragmentData {
  message: string;
}

export type FragmentData =
  | { kind: 'sidebar'; data: SidebarFragmentData }
  | { kind: 'file-table'; data: FileTableFragmentData }
  | { kind: 'folder-browser'; data: FolderBrowserFragmentData }
  | { kind: 'landing-page'; data: LandingPageFragmentData }
  | { kind: 'tooltip'; data: TooltipFragmentData }
  | { kind: 'loading'; data: LoadingFragmentData }
  | { kind: 'error'; data: ErrorFragmentData };

export interface RenderOptions {
  escape?: (text: string) => string;
}

export function createFragment(
  html: string,
  metadata: FragmentMetadata
): HtmlFragment {
  return { html, metadata };
}

export function createMetadata(
  kind: FragmentKind,
  options: Partial<Omit<FragmentMetadata, 'kind' | 'timestamp'>> = {}
): FragmentMetadata {
  return {
    kind,
    timestamp: Date.now(),
    ...options,
  };
}