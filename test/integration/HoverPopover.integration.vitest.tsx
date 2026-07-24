import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToolTip } from '../../src/App/components/hover/ToolTip';
import { TooltipContent } from '../../src/App/components/hover/TooltipContent';
import type { TooltipSection } from '../../src/main/translationService/renderable/types';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('ToolTip', () => {
  beforeEach(() => {
    (window as any).electronAPI = {
      getNodeDetail: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state when refPos is provided and fetch is pending', () => {
    (window as any).electronAPI.getNodeDetail.mockReturnValue(new Promise(() => {}));
    render(<ToolTip refPos={42} filePath="test.tsx" />);
    expect(screen.getByTestId('tooltip-loading')).toBeTruthy();
  });

  it('shows static tooltip when no refPos is provided', () => {
    render(<ToolTip fallbackTitle="useState(initialState)" fallbackBody="Declares a state variable." />);
    const el = screen.getByTestId('tooltip-static');
    expect(el).toBeTruthy();
    expect(screen.getByText('useState(initialState)')).toBeTruthy();
    expect(screen.getByText('Declares a state variable.')).toBeTruthy();
  });

  it('shows enrichment sections when getNodeDetail resolves', async () => {
    const sections: TooltipSection[] = [
      { type: 'definition', line: 5, snippet: [] },
      { type: 'type', text: 'string' },
    ];
    (window as any).electronAPI.getNodeDetail.mockResolvedValue({ sections, title: 'formatValue' });
    render(<ToolTip refPos={10} filePath="utils.ts" />);
    await act(async () => {});
    const el = screen.getByTestId('tooltip-sections');
    expect(el).toBeTruthy();
    expect(screen.getByText('formatValue')).toBeTruthy();
  });

  it('shows error state when getNodeDetail rejects', async () => {
    (window as any).electronAPI.getNodeDetail.mockRejectedValue(new Error('Network error'));
    render(<ToolTip refPos={15} filePath="api.ts" />);
    await act(async () => {});
    expect(screen.getByTestId('tooltip-error')).toBeTruthy();
    expect(screen.getByText(/Network error/)).toBeTruthy();
  });

  it('prevents duplicate getNodeDetail calls with askedRef', async () => {
    const mock = vi.fn().mockResolvedValue({ sections: [] });
    (window as any).electronAPI.getNodeDetail = mock;
    const { rerender } = render(<ToolTip refPos={10} filePath="test.ts" />);
    await act(async () => {});
    rerender(<ToolTip refPos={10} filePath="test.ts" />);
    await act(async () => {});
    expect(mock).toHaveBeenCalledTimes(1);
  });
});

describe('TooltipContent', () => {
  it('renders definition section with line number', () => {
    const sections: TooltipSection[] = [
      { type: 'definition', line: 42, snippet: [] },
    ];
    render(<TooltipContent sections={sections} />);
    expect(screen.getByText(/Definition.*line 42/)).toBeTruthy();
  });

  it('renders type section', () => {
    const sections: TooltipSection[] = [
      { type: 'type', text: 'string[]' },
    ];
    render(<TooltipContent sections={sections} />);
    expect(screen.getByText(/string\[\]/)).toBeTruthy();
  });

  it('shows no-info placeholder for empty sections', () => {
    render(<TooltipContent sections={[]} />);
    expect(screen.getByText('No information available')).toBeTruthy();
  });
});
