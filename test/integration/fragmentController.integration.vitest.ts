import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { clearCache, setRepoPath } from '../../src/main/translationService/cache/projectCache';

const FIXTURE_DIR = join(import.meta.dirname, '..', 'fixtures', 'repos', 'language-features');

const handlers = new Map<string, (_event: unknown, arg: unknown) => unknown>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, handler: (_event: unknown, arg: unknown) => unknown) => {
      handlers.set(channel, handler);
    },
  },
}));

describe('fragmentController IPC handlers', () => {
  beforeEach(() => {
    handlers.clear();
    clearCache();
    setRepoPath(FIXTURE_DIR);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers all fragment channels', async () => {
    const { registerFragmentHandlers } = await import('../../src/main/fragmentController');
    registerFragmentHandlers();

    expect(handlers.has('loadProjectFragment')).toBe(true);
    expect(handlers.has('getSidebarFragment')).toBe(true);
    expect(handlers.has('getFileFragment')).toBe(true);
    expect(handlers.has('getTooltipFragment')).toBe(true);
    expect(handlers.has('getFolderBrowserFragment')).toBe(true);
    expect(handlers.has('getLandingPageFragment')).toBe(true);
    expect(handlers.has('getLoadingFragment')).toBe(true);
  });

  it('loadProjectFragment returns a sidebar fragment', async () => {
    const { registerFragmentHandlers } = await import('../../src/main/fragmentController');
    registerFragmentHandlers();

    const handler = handlers.get('loadProjectFragment')!;
    const result = await handler(null, { path: FIXTURE_DIR });

    expect(result.html).toContain('data-role="sidebar"');
    expect(result.metadata.kind).toBe('sidebar');
  });

  it('getFileFragment returns file-table fragment matching direct renderer', async () => {
    const { renderFileTable } = await import('../../src/main/htmlRenderer/fileTableRenderer');
    const { buildFileData } = await import('../../src/main/translationService/buildFileData');
    const { readFile } = await import('fs/promises');
    const { registerFragmentHandlers } = await import('../../src/main/fragmentController');
    registerFragmentHandlers();

    const filePath = 'Functions.tsx';
    const sourceCode = await readFile(join(FIXTURE_DIR, filePath), 'utf-8');
    const { viewModel } = buildFileData(sourceCode, filePath);
    const direct = renderFileTable({ viewModel, fileName: filePath, filePath });

    const handler = handlers.get('getFileFragment')!;
    const result = await handler(null, { filePath });

    expect(result.html).toBe(direct.html);
    expect(result.metadata.kind).toBe('file-table');
    expect(result.metadata.filePath).toBe(filePath);
  });

  it('getTooltipFragment returns tooltip fragment after cache is populated', async () => {
    const { registerFragmentHandlers } = await import('../../src/main/fragmentController');
    registerFragmentHandlers();

    const filePath = 'Functions.tsx';
    const fileHandler = handlers.get('getFileFragment')!;
    await fileHandler(null, { filePath });

    const tooltipHandler = handlers.get('getTooltipFragment')!;
    const result = await tooltipHandler(null, { filePath, query: { refPos: 0 } });

    expect(result.metadata.kind).toBe('tooltip');
    expect(result.html).toContain('data-role="tooltip-content"');
  });

  it('getFileFragment rejects path traversal with typed error fragment', async () => {
    const { registerFragmentHandlers } = await import('../../src/main/fragmentController');
    registerFragmentHandlers();

    const handler = handlers.get('getFileFragment')!;
    const result = await handler(null, { filePath: '../../../etc/passwd' });

    expect(result.metadata.kind).toBe('error');
    expect(result.html).toContain('data-role="error"');
    expect(result.html).toContain('outside the loaded repository');
  });

  it('getFolderBrowserFragment returns folder-browser fragment', async () => {
    const { registerFragmentHandlers } = await import('../../src/main/fragmentController');
    registerFragmentHandlers();

    const handler = handlers.get('getFolderBrowserFragment')!;
    const result = await handler(null, { requestedPath: FIXTURE_DIR });

    expect(result.metadata.kind).toBe('folder-browser');
    expect(result.html).toContain('data-role="folder-browser-overlay"');
  });

  it('getLandingPageFragment returns landing-page fragment', async () => {
    const { renderLandingPage } = await import('../../src/main/htmlRenderer/landingPageRenderer');
    const { registerFragmentHandlers } = await import('../../src/main/fragmentController');
    registerFragmentHandlers();

    const direct = renderLandingPage({ loading: false, loadError: null });
    const handler = handlers.get('getLandingPageFragment')!;
    const result = await handler(null, undefined);

    expect(result.html).toBe(direct.html);
    expect(result.metadata.kind).toBe('landing-page');
  });

  it('getLoadingFragment returns loading fragment', async () => {
    const { renderLoading } = await import('../../src/main/htmlRenderer/stateRenderers');
    const { registerFragmentHandlers } = await import('../../src/main/fragmentController');
    registerFragmentHandlers();

    const direct = renderLoading({ message: 'Please wait...' });
    const handler = handlers.get('getLoadingFragment')!;
    const result = await handler(null, { message: 'Please wait...' });

    expect(result.html).toBe(direct.html);
    expect(result.metadata.kind).toBe('loading');
  });
});
