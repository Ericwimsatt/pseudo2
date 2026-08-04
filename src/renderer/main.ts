import 'htmx.org';
import { loadFragment } from './ipcAdapter';
import { initRouter, navigate, getCurrentRoute, getCurrentParams, onRouteChange } from './router';
import type { RouteParams } from './router';
import { initSidebar, refreshSidebar, clearSidebarCache } from './sidebar';
import { initFileView, afterFileSwap } from './fileView';
import { initHover, afterFileSwapHover } from './hover';
import { snapshot } from './debug';
import type { ElectronAPI } from '../shared/api';
import '../styles/index.css';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    htmx: typeof import('htmx.org');
    __pseudoDebug: { snapshot: typeof snapshot };
  }
}

window.__pseudoDebug = { snapshot };

async function loadLandingPage(): Promise<void> {
  const appContainer = document.querySelector('#app-container');
  if (!appContainer) return;

  showLandingLayout();

  const result = await loadFragment({
    method: 'getLandingPageFragment',
    args: {},
    target: '#app-container',
  });
  if (result) {
    setupLandingPageEvents();
  }
}

function showLandingLayout(): void {
  const app = document.querySelector('#app-container');
  if (app) {
    app.innerHTML = `<div id="landing-content" data-role="landing-page" class="min-h-screen h-screen bg-gray-50"></div>`;
  }
}

function showProjectLayout(): void {
  const app = document.querySelector('#app-container');
  if (app) {
    app.innerHTML = `
      <div class="flex h-screen overflow-hidden" data-role="project-shell">
        <div id="sidebar-container" class="flex-shrink-0"></div>
        <div id="file-content" class="flex-1 overflow-hidden flex flex-col"></div>
      </div>
    `;
  }
}

function setupLandingPageEvents(): void {
  const container = document.querySelector('#app-container');
  if (!container) return;

  container.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    const browseBtn = target.closest('[data-role="browse-button"]') || target.closest('[data-role="folder-select"]');
    if (browseBtn) {
      e.preventDefault();
      const dir = await window.electronAPI.openDirectorySelector();
      if (dir) {
        await loadProject(dir);
      }
      return;
    }

    const directoryItem = target.closest('[data-role="directory-item"]');
    if (directoryItem) {
      e.preventDefault();
      const path = directoryItem.getAttribute('data-path');
      if (path) {
        await loadFragment({
          method: 'getFolderBrowserFragment',
          args: { requestedPath: path },
          target: '#landing-content [data-role="folder-browser-modal"]',
        });
      }
      return;
    }

    const closeBtn = target.closest('[data-role="close-button"]');
    if (closeBtn) {
      e.preventDefault();
      await loadLandingPage();
      return;
    }
  });

  const landing = container.querySelector('#landing-content');
  if (landing) {
    landing.addEventListener('dragover', (e) => {
      e.preventDefault();
      const dropZone = landing.querySelector('[data-role="drop-zone"]');
      if (dropZone) dropZone.classList.add('border-blue-500', 'bg-blue-50');
    });
    landing.addEventListener('dragleave', () => {
      const dropZone = landing.querySelector('[data-role="drop-zone"]');
      if (dropZone) dropZone.classList.remove('border-blue-500', 'bg-blue-50');
    });
    (landing as HTMLElement).addEventListener('drop', async (e: DragEvent) => {
      e.preventDefault();
      const dropZone = landing.querySelector('[data-role="drop-zone"]');
      if (dropZone) dropZone.classList.remove('border-blue-500', 'bg-blue-50');
      const items = e.dataTransfer?.items;
      if (!items) return;
      const entries: FileSystemEntry[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) entries.push(entry);
      }
      const dirEntry = entries.find(e => e.isDirectory);
      if (!dirEntry) return;
      try {
        const files = await readDirectoryEntry(dirEntry);
        if (files.length === 0) return;
        const data = await window.electronAPI.uploadFolder({ files });
        await loadProject(data.path);
      } catch { }
    });
  }
}

async function readDirectoryEntry(entry: FileSystemEntry): Promise<{ path: string; content: string }[]> {
  return new Promise((resolve, reject) => {
    if (entry.isFile) {
      (entry as FileSystemFileEntry).file(file => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = btoa(
            new Uint8Array(reader.result as ArrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          const relativePath = entry.fullPath.startsWith('/') ? entry.fullPath.slice(1) : entry.fullPath;
          resolve([{ path: relativePath, content: base64 }]);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      }, reject);
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const allEntries: FileSystemEntry[] = [];
      const readBatch = () => {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) {
            const results = await Promise.all(allEntries.map(e => readDirectoryEntry(e)));
            resolve(results.flat());
          } else {
            allEntries.push(...entries);
            readBatch();
          }
        }, reject);
      };
      readBatch();
    } else {
      resolve([]);
    }
  });
}

async function loadProject(path: string): Promise<void> {
  clearSidebarCache();
  await window.electronAPI.setLastProjectPath(path);
  showProjectLayout();

  try {
    await window.electronAPI.loadProject({ path });
  } catch {
    await window.electronAPI.clearLastProjectPath();
    await loadLandingPage();
    return;
  }

  await refreshSidebar();

  const savedFilePath = await window.electronAPI.getLastFilePath();
  if (savedFilePath) {
    navigate(`/file/${encodeURIComponent(savedFilePath)}`);
  }
}

async function loadFileView(filePath: string, params: RouteParams): Promise<void> {
  const fileContainer = document.querySelector('#file-content');
  if (!fileContainer) return;

  await loadFragment({
    method: 'getFileFragment',
    args: { filePath, ...params },
    target: '#file-content',
  });
  afterFileSwap();
  afterFileSwapHover();
}

async function handleRoute(route: string, params: RouteParams): Promise<void> {
  if (route === '/' || route === '') {
    await loadLandingPage();
    return;
  }

  if (route.startsWith('/file/')) {
    let filePath: string;
    try {
      filePath = decodeURIComponent(route.slice(6));
    } catch {
      filePath = route.slice(6);
    }

    await refreshSidebar();
    window.electronAPI.setLastFilePath(filePath);
    await loadFileView(filePath, params);
  }
}

export async function bootstrapApp(): Promise<void> {
  initRouter();
  initSidebar();
  initFileView();
  initHover();

  if (!window.electronAPI) {
    const app = document.querySelector('#app-container');
    if (app) {
      app.innerHTML = `<div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="bg-white p-8 rounded-lg shadow-md w-[480px] text-center">
          <h1 class="text-2xl font-bold mb-4">PseudoTranslator</h1>
          <p class="text-gray-500">Running outside Electron context.</p>
          <p class="text-gray-400 text-sm mt-2">Launch with <code class="bg-gray-100 px-2 py-0.5 rounded">npm run dev</code></p>
        </div>
      </div>`;
    }
    return;
  }

  const savedTheme = await window.electronAPI.getTheme();
  document.documentElement.dataset.theme = savedTheme;

  const savedPath = await window.electronAPI.getLastProjectPath();
  if (savedPath) {
    await loadProject(savedPath);
    const route = getCurrentRoute();
    if (route && route !== '/') {
      await handleRoute(route, getCurrentParams());
    }
  } else {
    await loadLandingPage();
  }

  onRouteChange(handleRoute);

  window.electronAPI.onMenuLoadFolder(async (path: string) => {
    await loadProject(path);
  });

  window.electronAPI.onMenuSetTheme((theme: string) => {
    document.documentElement.dataset.theme = theme;
  });
}

bootstrapApp().catch(err => console.error('Bootstrap failed:', err));