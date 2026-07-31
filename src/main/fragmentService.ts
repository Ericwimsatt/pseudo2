import { resolve, relative, isAbsolute } from 'path';
import type { HtmlFragment } from './htmlRenderer/types';
import type { EnrichQuery } from './translationService/renderable/types';
import type { FileNode } from '../shared/api';
import { renderSidebar } from './htmlRenderer/sidebarRenderer';
import { renderFileTable } from './htmlRenderer/fileTableRenderer';
import { renderTooltip } from './htmlRenderer/tooltipRenderer';
import { renderFolderBrowser } from './htmlRenderer/folderBrowserRenderer';
import { renderLandingPage } from './htmlRenderer/landingPageRenderer';
import { renderLoading, renderError } from './htmlRenderer/stateRenderers';
import * as projectService from './project/projectService';
import * as translationService from './translationService/translationService';
import * as tooltipService from './tooltip/tooltipService';
import * as projectSelectService from './project/projectSelectService';
import { getRepoPath, clearCache } from './translationService/cache/projectCache';

export function validatePathInsideRepo(filePath: string): string {
  const rp = getRepoPath();
  if (!rp) {
    throw new Error('No repository loaded');
  }
  const fullPath = resolve(rp, filePath);
  const rel = relative(rp, fullPath);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('Path is outside the loaded repository');
  }
  return fullPath;
}

function toFragmentError(error: unknown): HtmlFragment {
  console.error('[fragmentService]', error);
  const message = error instanceof Error ? error.message : String(error);
  return renderError({ message });
}

export async function loadProjectAndRenderSidebar(
  projectPath: string,
  selectedFile: string | null = null,
  collapsed = false,
  expandedDirs: string[] = [],
): Promise<HtmlFragment> {
  try {
    clearCache();
    const result = await projectService.loadProject(projectPath);
    return renderSidebar({ tree: result.tree, selectedFile, collapsed, expandedDirs });
  } catch (error) {
    return toFragmentError(error);
  }
}

export async function renderSidebarFromTree(
  tree: FileNode[],
  selectedFile: string | null,
  collapsed: boolean,
  expandedDirs: string[] = [],
): Promise<HtmlFragment> {
  return renderSidebar({ tree, selectedFile, collapsed, expandedDirs });
}

export async function renderFileFragment(
  filePath: string,
  options: {
    targetSourceLine?: number | null;
    targetTransLine?: number | null;
    targetVar?: string | null;
    sourcePct?: number;
  } = {},
): Promise<HtmlFragment> {
  try {
    validatePathInsideRepo(filePath);

    const translationResult = await translationService.loadFileTranslation({ path: filePath });
    const fileName = filePath.split('/').pop() ?? filePath;

    return renderFileTable({
      viewModel: translationResult.viewModel,
      fileName,
      filePath,
      targetSourceLine: options.targetSourceLine,
      targetTransLine: options.targetTransLine,
      targetVar: options.targetVar,
      sourcePct: options.sourcePct,
    });
  } catch (error) {
    return toFragmentError(error);
  }
}

export async function renderTooltipFragment(
  filePath: string,
  query: EnrichQuery & { identifier?: string },
): Promise<HtmlFragment> {
  try {
    validatePathInsideRepo(filePath);
    const result = tooltipService.getNodeDetail({ filePath, query });
    return renderTooltip({
      title: result.title,
      body: result.body,
      sections: result.sections,
      filePath,
    });
  } catch (error) {
    return toFragmentError(error);
  }
}

export async function renderFolderBrowserFragment(
  requestedPath?: string,
): Promise<HtmlFragment> {
  try {
    const browseData = await projectSelectService.browseDirectory(requestedPath);
    return renderFolderBrowser({ browseData, loading: false, error: null });
  } catch (error) {
    return renderFolderBrowser({
      browseData: null,
      loading: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function renderLandingPageFragment(): Promise<HtmlFragment> {
  return renderLandingPage({ loading: false, loadError: null });
}

export async function renderLoadingFragment(
  message = 'Loading...',
): Promise<HtmlFragment> {
  return renderLoading({ message });
}
