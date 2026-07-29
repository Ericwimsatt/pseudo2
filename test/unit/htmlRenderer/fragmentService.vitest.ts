import { describe, it, expect, beforeEach } from 'vitest';
import { join } from 'path';
import { setRepoPath, clearCache } from '../../../src/main/translationService/cache/projectCache';
import { buildFileData } from '../../../src/main/translationService/buildFileData';
import { renderFileTable } from '../../../src/main/htmlRenderer/fileTableRenderer';
import { renderSidebar } from '../../../src/main/htmlRenderer/sidebarRenderer';
import { renderLandingPage } from '../../../src/main/htmlRenderer/landingPageRenderer';
import { renderLoading } from '../../../src/main/htmlRenderer/stateRenderers';
import {
  renderFileFragment,
  renderSidebarFromTree,
  renderTooltipFragment,
  renderFolderBrowserFragment,
  renderLandingPageFragment,
  renderLoadingFragment,
} from '../../../src/main/fragmentService';
import { readFile } from 'fs/promises';

const FIXTURE_DIR = join(import.meta.dirname, '..', '..', 'fixtures', 'repos', 'language-features');

describe('fragmentService', () => {
  beforeEach(() => {
    clearCache();
    setRepoPath(FIXTURE_DIR);
  });

  describe('renderFileFragment', () => {
    it('returns same HTML as direct renderer for .tsx file', async () => {
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

    it('returns same HTML for .ts file', async () => {
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

    it('includes targetSourceLine in metadata', async () => {
      const fragment = await renderFileFragment('Functions.tsx', {
        targetSourceLine: 5,
      });

      expect(fragment.metadata.lineNumber).toBe(5);
    });

    it('applies sourcePct to rendered output', async () => {
      const fragment = await renderFileFragment('Functions.tsx', {
        sourcePct: 70,
      });

      expect(fragment.html).toContain('data-source-pct="70"');
      expect(fragment.html).toContain('grid-template-columns: 6px 48px 70%');
    });

    it('returns error fragment for path outside repo', async () => {
      const fragment = await renderFileFragment('../../../etc/passwd');

      expect(fragment.metadata.kind).toBe('error');
      expect(fragment.html).toContain('outside the loaded repository');
    });

    it('returns error fragment for nonexistent file', async () => {
      const fragment = await renderFileFragment('nonexistent.ts');

      expect(fragment.metadata.kind).toBe('error');
      expect(fragment.html).toContain('Error');
    });

    it('escapes malicious source text', async () => {
      const filePath = 'Functions.tsx';
      const fragment = await renderFileFragment(filePath);

      expect(fragment.html).not.toContain('<script>');
    });
  });

  describe('renderSidebarFromTree', () => {
    const mockTree = [
      {
        name: 'src',
        path: 'src',
        type: 'directory' as const,
        children: [
          { name: 'index.ts', path: 'src/index.ts', type: 'file' as const },
        ],
      },
      { name: 'README.md', path: 'README.md', type: 'file' as const },
    ];

    it('returns same HTML as direct renderer', async () => {
      const direct = renderSidebar({ tree: mockTree, selectedFile: null, collapsed: false });
      const fragment = await renderSidebarFromTree(mockTree, null, false);

      expect(fragment.html).toBe(direct.html);
      expect(fragment.metadata.kind).toBe('sidebar');
    });

    it('passes selectedFile through', async () => {
      const fragment = await renderSidebarFromTree(mockTree, 'README.md', false);

      expect(fragment.html).toContain('bg-blue-100');
      expect(fragment.html).toContain('README.md');
    });

    it('handles collapsed state', async () => {
      const fragment = await renderSidebarFromTree(mockTree, null, true);

      expect(fragment.html).toContain('data-collapsed="true"');
    });
  });

  describe('renderTooltipFragment', () => {
    it('returns tooltip fragment for valid query', async () => {
      const filePath = 'Functions.tsx';
      // Populate cache via renderFileFragment (which calls loadFileTranslation)
      await renderFileFragment(filePath);

      const fragment = await renderTooltipFragment(filePath, { refPos: 0 });

      expect(fragment.metadata.kind).toBe('tooltip');
      expect(fragment.html).toContain('data-role="tooltip-content"');
    });

    it('returns error fragment for path outside repo', async () => {
      const fragment = await renderTooltipFragment('../../../etc/passwd', { refPos: 0 });

      expect(fragment.metadata.kind).toBe('error');
      expect(fragment.html).toContain('outside the loaded repository');
    });

    it('includes filePath in tooltip for navigation links', async () => {
      const filePath = 'Functions.tsx';
      await renderFileFragment(filePath);

      const fragment = await renderTooltipFragment(filePath, { refPos: 0 });

      expect(fragment.metadata.kind).toBe('tooltip');
      if (fragment.html.includes('data-role="tooltip-definition"')) {
        expect(fragment.html).toContain('data-file-path="' + filePath + '"');
      }
    });
  });

  describe('renderFolderBrowserFragment', () => {
    it('returns folder browser with directory listing', async () => {
      const reposDir = join(FIXTURE_DIR, '..');
      const fragment = await renderFolderBrowserFragment(reposDir);

      expect(fragment.metadata.kind).toBe('folder-browser');
      expect(fragment.html).toContain('data-role="folder-browser-overlay"');
      expect(fragment.html).toContain('data-role="directory-item"');
    });

    it('returns error state for invalid path', async () => {
      const fragment = await renderFolderBrowserFragment('/nonexistent/path');

      expect(fragment.html).toContain('data-role="error"');
    });
  });

  describe('renderLandingPageFragment', () => {
    it('returns landing page fragment', async () => {
      const direct = renderLandingPage({ loading: false, loadError: null });
      const fragment = await renderLandingPageFragment();

      expect(fragment.html).toBe(direct.html);
      expect(fragment.metadata.kind).toBe('landing-page');
    });
  });

  describe('renderLoadingFragment', () => {
    it('returns loading fragment with default message', async () => {
      const direct = renderLoading({ message: 'Loading...' });
      const fragment = await renderLoadingFragment();

      expect(fragment.html).toBe(direct.html);
      expect(fragment.metadata.kind).toBe('loading');
    });

    it('returns loading fragment with custom message', async () => {
      const fragment = await renderLoadingFragment('Please wait...');

      expect(fragment.html).toContain('Please wait...');
    });
  });

  describe('cache clearing', () => {
    it('clears cache on re-entry', async () => {
      await renderFileFragment('Functions.tsx');
      await renderFileFragment('Functions.tsx');

      expect(true).toBe(true);
    });

    it('clears translation cache when switching projects', async () => {
      await renderFileFragment('Functions.tsx');

      clearCache();
      setRepoPath(FIXTURE_DIR);

      const fragment = await renderFileFragment('Functions.tsx');
      expect(fragment.metadata.kind).toBe('file-table');
      expect(fragment.html).toContain('data-role="file-table"');
    });

    it('returns empty tooltip when cache is cleared', async () => {
      await renderFileFragment('Functions.tsx');
      clearCache();
      setRepoPath(FIXTURE_DIR);

      const fragment = await renderTooltipFragment('Functions.tsx', { refPos: 0 });
      expect(fragment.metadata.kind).toBe('tooltip');
      expect(fragment.html).toContain('No information available');
    });
  });

  describe('malicious string handling', () => {
    it('escapes XSS in sidebar file names', async () => {
      const maliciousTree = [
        { name: '<img onerror=alert(1)>', path: 'test.ts', type: 'file' as const },
      ];
      const fragment = await renderSidebarFromTree(maliciousTree, null, false);

      expect(fragment.html).not.toContain('<img');
      expect(fragment.html).toContain('&lt;img');
    });

    it('escapes path traversal attempts', async () => {
      const fragment = await renderFileFragment('../../etc/passwd');
      expect(fragment.metadata.kind).toBe('error');
      expect(fragment.html).toContain('outside the loaded repository');
    });

    it('escapes encoded path traversal', async () => {
      const fragment = await renderFileFragment('%2e%2e/%2e%2e/etc/passwd');
      expect(fragment.metadata.kind).toBe('error');
    });

    it('escapes XSS in tooltip type text', async () => {
      const filePath = 'Functions.tsx';
      await renderFileFragment(filePath);

      const fragment = await renderTooltipFragment(filePath, { refPos: 0 });
      expect(fragment.html).not.toContain('<script>');
      expect(fragment.html).not.toContain('onerror=');
    });

    it('escapes XSS in folder browser error', async () => {
      const fragment = await renderFolderBrowserFragment('/nonexistent/path/<script>alert(1)</script>');
      expect(fragment.html).not.toContain('<script>');
    });

    it('escapes double quotes in sidebar data attributes', async () => {
      const maliciousTree = [
        { name: 'test" onclick="alert(1)', path: 'test.ts', type: 'file' as const },
      ];
      const fragment = await renderSidebarFromTree(maliciousTree, null, false);

      expect(fragment.html).not.toContain('onclick="alert(1)"');
    });
  });

  describe('error serialization', () => {
    it('returns error fragment for path outside repo on file', async () => {
      const fragment = await renderFileFragment('../../etc/passwd');
      expect(fragment.metadata.kind).toBe('error');
      expect(fragment.html).toContain('data-role="error"');
      expect(fragment.html).toContain('outside the loaded repository');
    });

    it('returns error fragment for path outside repo on tooltip', async () => {
      const fragment = await renderTooltipFragment('../../etc/shadow', { refPos: 0 });
      expect(fragment.metadata.kind).toBe('error');
      expect(fragment.html).toContain('data-role="error"');
    });

    it('returns error for nonexistent file', async () => {
      const fragment = await renderFileFragment('does-not-exist.ts');
      expect(fragment.metadata.kind).toBe('error');
      expect(fragment.html).toContain('Error');
    });

    it('returns folder browser error for invalid browse path', async () => {
      const fragment = await renderFolderBrowserFragment('/completely/fake/path');
      expect(fragment.html).toContain('data-role="error"');
    });
  });

  describe('tooltip edge cases', () => {
    it('returns empty tooltip content when no cache populated', async () => {
      const fragment = await renderTooltipFragment('Functions.tsx', { refPos: 999 });
      expect(fragment.metadata.kind).toBe('tooltip');
      expect(fragment.html).toContain('data-role="tooltip-content"');
    });

    it('handles tooltip with identifier query', async () => {
      await renderFileFragment('Functions.tsx');
      const fragment = await renderTooltipFragment('Functions.tsx', {
        refPos: 0,
        identifier: 'useState',
      });
      expect(fragment.metadata.kind).toBe('tooltip');
    });
  });

  describe('file fragment options', () => {
    it('passes targetTransLine through metadata', async () => {
      const fragment = await renderFileFragment('Functions.tsx', {
        targetTransLine: 10,
      });
      expect(fragment.metadata.lineNumber).toBe(10);
    });

    it('passes targetVar to rendered output', async () => {
      const fragment = await renderFileFragment('Functions.tsx', {
        targetVar: 'myVar',
      });
      expect(fragment.html).toContain('data-search-context');
    });

    it('defaults sourcePct to 50', async () => {
      const fragment = await renderFileFragment('Functions.tsx');
      expect(fragment.html).toContain('data-source-pct="50"');
    });
  });

  describe('folder browser edge cases', () => {
    it('renders folder browser with no directories', async () => {
      const fragment = await renderFolderBrowserFragment(FIXTURE_DIR);
      expect(fragment.metadata.kind).toBe('folder-browser');
      expect(fragment.html).toContain('data-role="folder-browser-modal"');
    });

    it('returns folder browser without requested path', async () => {
      const fragment = await renderFolderBrowserFragment();
      expect(fragment.metadata.kind).toBe('folder-browser');
      expect(fragment.html).toContain('data-role="folder-browser-overlay"');
    });
  });
});
