import { describe, it, expect } from 'vitest';
import { renderSidebar } from '../../../src/main/htmlRenderer/sidebarRenderer';

const AMP = String.fromCharCode(38) + 'amp;';
const LT = String.fromCharCode(38) + 'lt;';
const GT = String.fromCharCode(38) + 'gt;';
const QUOT = String.fromCharCode(38) + 'quot;';
const APOS = String.fromCharCode(38) + 'apos;';

describe('sidebarRenderer', () => {
  const mockTree = [
    { name: 'src', path: 'src', type: 'directory' as const, children: [
      { name: 'index.ts', path: 'src/index.ts', type: 'file' as const },
      { name: 'utils.ts', path: 'src/utils.ts', type: 'file' as const },
    ]},
    { name: 'README.md', path: 'README.md', type: 'file' as const },
  ];

  it('renders expanded sidebar with files and directories', () => {
    const result = renderSidebar({ tree: mockTree, selectedFile: 'src/index.ts', collapsed: false, expandedDirs: ['src'] });

    expect(result.html).toContain('data-role="sidebar"');
    expect(result.html).toContain('data-collapsed="false"');
    expect(result.html).toContain('data-role="sidebar-directory"');
    expect(result.html).toContain('data-path="src"');
    expect(result.html).toContain('data-role="sidebar-file"');
    expect(result.html).toContain('src/index.ts');
    expect(result.html).toContain('README.md');
    expect(result.html).toContain('bg-blue-100');
    expect(result.metadata.kind).toBe('sidebar');
  });

  it('hides directory children when the directory is not expanded', () => {
    const result = renderSidebar({ tree: mockTree, selectedFile: null, collapsed: false });

    expect(result.html).toContain('data-path="src"');
    expect(result.html).toContain('data-open="false"');
    expect(result.html).toContain('src/index.ts');
    expect(result.html).toContain('data-role="sidebar-children"');
    expect(result.html).toContain('display: none');
    expect(result.html).toContain('data-action="toggle-directory"');
  });

  it('shows directory children when the directory is expanded', () => {
    const result = renderSidebar({ tree: mockTree, selectedFile: null, collapsed: false, expandedDirs: ['src'] });

    expect(result.html).toContain('data-open="true"');
    expect(result.html).toContain('data-role="sidebar-children"');
    expect(result.html).not.toContain('display: none');
  });

  it('toggle-directory button uses data-action contract', () => {
    const result = renderSidebar({ tree: mockTree, selectedFile: null, collapsed: false });

    expect(result.html).toContain('data-action="toggle-directory"');
    expect(result.html).toContain('data-action="collapse-sidebar"');
  });

  it('renders collapsed sidebar', () => {
    const result = renderSidebar({ tree: mockTree, selectedFile: null, collapsed: true });

    expect(result.html).toContain('data-collapsed="true"');
    expect(result.html).toContain('data-action="expand-sidebar"');
    expect(result.html).not.toContain('data-role="sidebar-directory"');
  });

  it('marks selected file', () => {
    const result = renderSidebar({ tree: mockTree, selectedFile: 'README.md', collapsed: false });

    expect(result.html).toContain('bg-blue-100');
    expect(result.html).toContain('text-blue-900');
    expect(result.html).toContain('README.md');
  });

  it('escapes special characters in file names', () => {
    const treeWithSpecial = [{ name: 'file<>&"\'', path: 'file<>&"\'', type: 'file' as const }];
    const result = renderSidebar({ tree: treeWithSpecial, selectedFile: null, collapsed: false });

    const escaped = 'file' + LT + GT + AMP + QUOT + APOS;
    expect(result.html).toContain(escaped);
    expect(result.html).not.toContain('<script>');
  });

  it('includes timestamp in metadata', () => {
    const result = renderSidebar({ tree: mockTree, selectedFile: null, collapsed: false });

    expect(result.metadata.timestamp).toBeTypeOf('number');
    expect(result.metadata.kind).toBe('sidebar');
  });
});
