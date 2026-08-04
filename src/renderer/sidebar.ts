import { loadFragment } from './ipcAdapter';
import { navigate } from './router';

let sidebarCollapsed = false;
let sidebarCache: Record<string, boolean> = {};

export function isCollapsed(): boolean {
  return sidebarCollapsed;
}

export function getExpandedDirs(): Record<string, boolean> {
  return { ...sidebarCache };
}

export function initSidebar(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const sidebarEl = target.closest('[data-role="sidebar"]');
    if (!sidebarEl) return;

    const dirToggle = target.closest('[data-action="toggle-directory"]');
    if (dirToggle) {
      e.preventDefault();
      e.stopPropagation();
      const dir = dirToggle.closest('[data-role="sidebar-directory"]');
      const path = dir?.getAttribute('data-path');
      if (path) {
        toggleDirectory(path);
      }
      return;
    }

    const collapseBtn = target.closest('[data-action="collapse-sidebar"]');
    if (collapseBtn) {
      e.preventDefault();
      sidebarCollapsed = true;
      refreshSidebar();
      return;
    }

    const expandBtn = target.closest('[data-action="expand-sidebar"]');
    if (expandBtn) {
      e.preventDefault();
      sidebarCollapsed = false;
      refreshSidebar();
      return;
    }

    const fileLink = target.closest('[data-role="sidebar-file"]');
    if (fileLink) {
      e.preventDefault();
      const path = fileLink.getAttribute('data-path');
      if (path) {
        navigate(`/file/${encodeURIComponent(path)}`);
      }
      return;
    }
  });
}

function toggleDirectory(path: string): void {
  if (sidebarCache[path]) {
    delete sidebarCache[path];
  } else {
    sidebarCache[path] = true;
  }
  toggleDirectoryInDom(path);
}

const FOLDER_TOGGLE_OPEN = '▼';
const FOLDER_TOGGLE_CLOSED = '▶';

function toggleDirectoryInDom(path: string): void {
  const dir = document.querySelector(
    `[data-role="sidebar-directory"][data-path="${CSS.escape(path)}"]`,
  );
  if (!dir) return;
  const isOpen = !!sidebarCache[path];
  dir.setAttribute('data-open', String(isOpen));
  const toggle = dir.querySelector('[data-action="toggle-directory"]');
  if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
  const children = dir.querySelector(':scope > [data-role="sidebar-children"]') as HTMLElement | null;
  if (children) children.style.display = isOpen ? '' : 'none';
  const icon = dir.querySelector('[data-role="sidebar-toggle-icon"]');
  if (icon) {
    icon.textContent = isOpen ? FOLDER_TOGGLE_OPEN : FOLDER_TOGGLE_CLOSED;
    icon.classList.toggle('is-open', isOpen);
  }
}

export async function refreshSidebar(): Promise<void> {
  const target = document.querySelector('#sidebar-container');
  if (!target) return;

  const electronAPI = window.electronAPI;

  const { tree } = await electronAPI.getTree();
  await loadFragment({
    method: 'getSidebarFragment',
    args: {
      tree,
      selectedFile: getCurrentFile(),
      collapsed: sidebarCollapsed,
      expandedDirs: Object.keys(sidebarCache),
    },
    target: '#sidebar-container',
  });
}

function getCurrentFile(): string | null {
  const route = window.location.hash.slice(1);
  const path = route.includes('?') ? route.slice(0, route.indexOf('?')) : route;
  if (path.startsWith('/file/')) {
    try {
      return decodeURIComponent(path.slice(6));
    } catch {
      return path.slice(6);
    }
  }
  return null;
}

export function clearSidebarCache(): void {
  sidebarCache = {};
}

export function setSidebarCollapsed(collapsed: boolean): void {
  sidebarCollapsed = collapsed;
}
