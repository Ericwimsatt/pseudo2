import { describe, it, expect, beforeEach } from 'vitest';
import { join } from 'path';
import { setRepoPath, clearCache } from '../../src/main/translationService/cache/projectCache';
import { buildFileData } from '../../src/main/translationService/buildFileData';
import { renderFileTable } from '../../src/main/htmlRenderer/fileTableRenderer';
import { renderSidebar } from '../../src/main/htmlRenderer/sidebarRenderer';
import { renderLandingPage } from '../../src/main/htmlRenderer/landingPageRenderer';
import { renderLoading } from '../../src/main/htmlRenderer/stateRenderers';
import {
  renderFileFragment,
  renderSidebarFromTree,
  loadProjectAndRenderSidebar,
  renderTooltipFragment,
  renderFolderBrowserFragment,
  renderLandingPageFragment,
  renderLoadingFragment,
} from '../../src/main/fragmentService';
import { readFile } from 'fs/promises';

const FIXTURE_DIR = join(import.meta.dirname, '..', 'fixtures', 'repos', 'language-features');

/**
 * IPC/service integration tests for the fragment layer.
 *
 * These exercise the same service functions that the IPC handlers invoke,
 * proving that the canonical HTML returned through the typed preload bridge
 * matches the direct renderer output for the same input.
 */
describe('fragmentService IPC integration', () => {
  beforeEach(() => {
    clearCache();
    setRepoPath(FIXTURE_DIR);
  });

  describe('project loading and file rendering', () => {
    it('renders file fragment equal to direct renderer for .tsx', async () => {
      const filePath = 'Functions.tsx';
      const sourceCode = await readFile(join(FIXTURE_DIR, filePath), 'utf-8');
      const { viewModel } = buildFileData(sourceCode, filePath);

      const direct = renderFileTable({
        viewModel,
        fileName: 'Functions.tsx',
        filePath,
      });

      const fragment = await renderFileFragment(filePath);

      expect(fragment.html).toBe(direct.html);
      expect(fragment.metadata.kind).toBe('file-table');
      expect(fragment.metadata.filePath).toBe(filePath);
    });

    it('renders file fragment equal to direct renderer for .ts', async () => {
      const filePath = 'Enums.ts';
      const sourceCode = await readFile(join(FIXTURE_DIR, filePath), 'utf-8');
      const { viewModel } = buildFileData(sourceCode, filePath);

      const direct = renderFileTable({
        viewModel,
        fileName: 'Enums.ts',
        filePath,
      });

      const fragment = await renderFileFragment(filePath);

      expect(fragment.html).toBe(direct.html);
    });

    it('loads project and renders sidebar through bootstrap path', async () => {
      const fragment = await loadProjectAndRenderSidebar(FIXTURE_DIR, 'Functions.tsx', false);

      expect(fragment.metadata.kind).toBe('sidebar');
      expect(fragment.html).toContain('data-role="sidebar"');
      expect(fragment.html).toContain('Functions.tsx');
      expect(fragment.html).toContain('bg-blue-100');
    });
  });

  describe('tooltip rendering', () => {
    it('renders tooltip fragment after cache is populated', async () => {
      const filePath = 'Functions.tsx';
      await renderFileFragment(filePath);

      const fragment = await renderTooltipFragment(filePath, { refPos: 0 });

      expect(fragment.metadata.kind).toBe('tooltip');
      expect(fragment.html).toContain('data-role="tooltip-content"');
    });

    it('returns empty tooltip when no cache is populated', async () => {
      const fragment = await renderTooltipFragment('Functions.tsx', { refPos: 0 });

      expect(fragment.metadata.kind).toBe('tooltip');
      expect(fragment.html).toContain('No information available');
    });
  });

  describe('directory browsing', () => {
    it('renders folder browser fragment with directory listing', async () => {
      const reposDir = join(FIXTURE_DIR, '..');
      const fragment = await renderFolderBrowserFragment(reposDir);

      expect(fragment.metadata.kind).toBe('folder-browser');
      expect(fragment.html).toContain('data-role="folder-browser-overlay"');
      expect(fragment.html).toContain('data-role="directory-item"');
    });

    it('renders error state for invalid browse path', async () => {
      const fragment = await renderFolderBrowserFragment('/nonexistent/path');

      expect(fragment.html).toContain('data-role="error"');
    });
  });

  describe('persistence-safe loading', () => {
    it('produces stable fragments across repeated loads', async () => {
      const first = await renderFileFragment('Functions.tsx');
      const second = await renderFileFragment('Functions.tsx');

      expect(first.html).toBe(second.html);
      expect(first.metadata.kind).toBe('file-table');
      expect(second.metadata.kind).toBe('file-table');
    });
  });

  describe('error serialization', () => {
    it('returns escaped error fragment for path outside repo', async () => {
      const fragment = await renderFileFragment('../../../etc/passwd');

      expect(fragment.metadata.kind).toBe('error');
      expect(fragment.html).toContain('outside the loaded repository');
      expect(fragment.html).toContain('data-role="error"');
    });

    it('returns escaped error fragment for nonexistent file', async () => {
      const fragment = await renderFileFragment('does-not-exist.ts');

      expect(fragment.metadata.kind).toBe('error');
      expect(fragment.html).toContain('Error');
    });

    it('returns escaped error fragment for tooltip outside repo', async () => {
      const fragment = await renderTooltipFragment('../../../etc/shadow', { refPos: 0 });

      expect(fragment.metadata.kind).toBe('error');
      expect(fragment.html).toContain('outside the loaded repository');
    });
  });

  describe('malicious string handling', () => {
    it('escapes XSS in rendered file source', async () => {
      const fragment = await renderFileFragment('Functions.tsx');

      expect(fragment.html).not.toContain('<script>');
      expect(fragment.html).not.toContain('onerror=');
    });

    it('escapes XSS in sidebar file names', async () => {
      const maliciousTree = [
        { name: '<img onerror=alert(1)>', path: 'test.ts', type: 'file' as const },
      ];
      const direct = renderSidebar({ tree: maliciousTree, selectedFile: null, collapsed: false });
      const fragment = await renderSidebarFromTree(maliciousTree, null, false);

      expect(fragment.html).toBe(direct.html);
      expect(fragment.html).not.toContain('<img');
      expect(fragment.html).toContain('&lt;img');
    });

    it('escapes path traversal in file path', async () => {
      const fragment = await renderFileFragment('../../etc/passwd');
      expect(fragment.metadata.kind).toBe('error');
      expect(fragment.html).toContain('outside the loaded repository');
    });
  });

  describe('cache staleness', () => {
    it('clears translation cache when loading a new project', async () => {
      await renderFileFragment('Functions.tsx');
      const before = await renderTooltipFragment('Functions.tsx', { refPos: 0 });
      expect(before.metadata.kind).toBe('tooltip');

      clearCache();
      setRepoPath(FIXTURE_DIR);

      const fragment = await renderFileFragment('Functions.tsx');
      expect(fragment.metadata.kind).toBe('file-table');
    });

    it('returns empty tooltip after project cache is cleared', async () => {
      await renderFileFragment('Functions.tsx');
      clearCache();
      setRepoPath(FIXTURE_DIR);

      const fragment = await renderTooltipFragment('Functions.tsx', { refPos: 0 });
      expect(fragment.metadata.kind).toBe('tooltip');
      expect(fragment.html).toContain('No information available');
    });
  });

  describe('landing page and loading fragments', () => {
    it('renders landing page fragment equal to direct renderer', async () => {
      const direct = renderLandingPage({ loading: false, loadError: null });
      const fragment = await renderLandingPageFragment();

      expect(fragment.html).toBe(direct.html);
      expect(fragment.metadata.kind).toBe('landing-page');
    });

    it('renders loading fragment equal to direct renderer', async () => {
      const direct = renderLoading({ message: 'Loading...' });
      const fragment = await renderLoadingFragment();

      expect(fragment.html).toBe(direct.html);
      expect(fragment.metadata.kind).toBe('loading');
    });
  });
});
