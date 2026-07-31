import { getCurrentRoute, getCurrentParams } from './router';
import { isCollapsed, getExpandedDirs } from './sidebar';
import { getSelectionMode, getSourcePct, getSearchState } from './fileView';
import { getHoverState } from './hover';

export interface DebugSnapshot {
  route: string;
  params: Record<string, unknown>;
  sidebarCollapsed: boolean;
  sidebarExpandedDirs: Record<string, boolean>;
  appHTML: {
    sidebar: string | null;
    fileContent: string | null;
    landingPage: string | null;
    tooltipContent: string | null;
  };
  fileView: {
    selectionMode: string;
    sourcePct: number;
    searchActive: boolean;
    searchTerm: string;
    searchMatches: number;
    searchCurrentIndex: number;
  };
  hover: {
    active: boolean;
    refPos: number | undefined;
    filePath: string | undefined;
  };
  activeFragments: string[];
  timestamp: number;
}

export function snapshot(): DebugSnapshot {
  const sidebar = document.querySelector('[data-role="sidebar"]');
  const fileTable = document.querySelector('[data-role="file-table"]');
  const landingPage = document.querySelector('[data-role="landing-page"]');
  const tooltipContainer = document.querySelector('[data-role="tooltip-container"]');

  const activeFragments: string[] = [];
  document.querySelectorAll('[data-fragment-root]').forEach(el => {
    const kind = el.getAttribute('data-fragment-root');
    if (kind) activeFragments.push(kind);
  });

  const search = getSearchState();
  const hover = getHoverState();

  return {
    route: getCurrentRoute(),
    params: { ...getCurrentParams() },
    sidebarCollapsed: isCollapsed(),
    sidebarExpandedDirs: getExpandedDirs(),
    appHTML: {
      sidebar: sidebar?.outerHTML ?? null,
      fileContent: fileTable?.outerHTML ?? null,
      landingPage: landingPage?.outerHTML ?? null,
      tooltipContent: tooltipContainer?.innerHTML ?? null,
    },
    fileView: {
      selectionMode: getSelectionMode(),
      sourcePct: getSourcePct(),
      searchActive: search.active,
      searchTerm: search.term,
      searchMatches: search.matches.length,
      searchCurrentIndex: search.currentIndex,
    },
    hover: {
      active: hover.trigger !== null,
      refPos: hover.refPos,
      filePath: hover.filePath,
    },
    activeFragments,
    timestamp: Date.now(),
  };
}