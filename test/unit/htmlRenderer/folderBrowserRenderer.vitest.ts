import { describe, it, expect } from 'vitest';
import { renderFolderBrowser } from '../../../src/main/htmlRenderer/folderBrowserRenderer';

describe('folderBrowserRenderer', () => {
  const mockBrowseData = {
    currentPath: '/home/user/project',
    parentPath: '/home/user',
    directories: [
      { name: 'src', path: '/home/user/project/src' },
      { name: 'tests', path: '/home/user/project/tests' },
    ],
  };

  it('renders loading state', () => {
    const result = renderFolderBrowser({ browseData: null, loading: true, error: null });

    expect(result.html).toContain('data-role="folder-browser-modal"');
    expect(result.html).toContain('Loading...');
    expect(result.html).toContain('data-role="loading"');
  });

  it('renders error state', () => {
    const result = renderFolderBrowser({ browseData: null, loading: false, error: 'Permission denied' });

    expect(result.html).toContain('data-role="error"');
    expect(result.html).toContain('Permission denied');
  });

  it('renders directories list', () => {
    const result = renderFolderBrowser({ browseData: mockBrowseData, loading: false, error: null });

    expect(result.html).toContain('data-role="folder-browser-modal"');
    expect(result.html).toContain('data-role="directory-item"');
    expect(result.html).toContain('data-path="/home/user/project/src"');
    expect(result.html).toContain('src');
    expect(result.html).toContain('tests');
  });

  it('shows empty state when no directories', () => {
    const emptyData = { ...mockBrowseData, directories: [] };
    const result = renderFolderBrowser({ browseData: emptyData, loading: false, error: null });

    expect(result.html).toContain('No subdirectories');
  });

  it('shows parent directory button when available', () => {
    const result = renderFolderBrowser({ browseData: mockBrowseData, loading: false, error: null });

    expect(result.html).toContain('data-role="parent-directory"');
    expect(result.html).toContain('data-path="/home/user"');
    expect(result.html).toContain('.. Up');
  });

  it('disables select button when no browse data', () => {
    const result = renderFolderBrowser({ browseData: null, loading: false, error: null });

    expect(result.html).toContain('disabled');
  });

  it('escapes directory names', () => {
    const dataWithSpecial = {
      currentPath: '/test',
      parentPath: null,
      directories: [{ name: 'dir<>&', path: '/test/dir<>&' }],
    };
    const result = renderFolderBrowser({ browseData: dataWithSpecial, loading: false, error: null });

    const escapedName = 'dir' + String.fromCharCode(38) + 'lt;' + String.fromCharCode(38) + 'gt;' + String.fromCharCode(38) + 'amp;';
    expect(result.html).toContain(escapedName);
    expect(result.html).not.toContain('<script>');
  });

  it('includes metadata', () => {
    const result = renderFolderBrowser({ browseData: mockBrowseData, loading: false, error: null });

    expect(result.metadata.kind).toBe('folder-browser');
    expect(result.metadata.timestamp).toBeTypeOf('number');
  });
});