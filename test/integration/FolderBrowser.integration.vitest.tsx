import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FolderBrowser from '../../src/App/components/FolderBrowser';

function createMockApi(overrides: Record<string, any> = {}) {
  (window as any).electronAPI = {
    browseDirectory: vi.fn().mockResolvedValue({
      currentPath: '/Users/test/project',
      parentPath: '/Users/test',
      directories: [
        { name: 'src', path: '/Users/test/project/src' },
        { name: 'dist', path: '/Users/test/project/dist' },
      ],
    }),
    ...overrides,
  };
}

describe('FolderBrowser', () => {
  beforeEach(() => {
    createMockApi();
  });

  it('shows current path', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<FolderBrowser onSelect={onSelect} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('/Users/test/project')).toBeTruthy();
    });
  });

  it('renders folder names in the directory listing', async () => {
    render(<FolderBrowser onSelect={vi.fn()} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('src')).toBeTruthy();
      expect(screen.getByText('dist')).toBeTruthy();
    });
  });

  it('shows Up button when parentPath is available', async () => {
    render(<FolderBrowser onSelect={vi.fn()} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('.. Up')).toBeTruthy();
    });
  });

  it('shows loading state initially', () => {
    (window as any).electronAPI.browseDirectory.mockReturnValue(new Promise(() => {}));
    render(<FolderBrowser onSelect={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('shows error state when browse fails', async () => {
    (window as any).electronAPI.browseDirectory.mockRejectedValue(new Error('Permission denied'));
    render(<FolderBrowser onSelect={vi.fn()} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText('Permission denied')).toBeTruthy();
    });
  });

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    render(<FolderBrowser onSelect={vi.fn()} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeTruthy();
    });
    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('enables Select button after data loads', async () => {
    render(<FolderBrowser onSelect={vi.fn()} onClose={vi.fn()} />);
    await waitFor(() => {
      const btn = screen.getByText('Select This Folder');
      expect(btn).not.toBeDisabled();
    });
  });
});
