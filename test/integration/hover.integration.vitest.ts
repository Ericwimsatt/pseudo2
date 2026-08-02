import { afterEach, describe, expect, it, vi } from 'vitest';
import { afterFileSwapHover, getHoverState, initHover } from '../../src/renderer/hover';

describe('hover fragment interaction', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    delete (window as unknown as Record<string, unknown>).electronAPI;
  });

  it('positions a server-rendered tooltip, sends module metadata, and resets after dismissal', async () => {
    vi.useFakeTimers();
    const getTooltipFragment = vi.fn(async () => ({
      html: '<div data-role="tooltip-content">Module: react</div>',
      metadata: { kind: 'tooltip', timestamp: Date.now() },
    }));
    (window as unknown as Record<string, unknown>).electronAPI = { getTooltipFragment };
    document.body.innerHTML = `
      <div data-role="file-table" data-file-path="Imports.ts">
        <span data-refpos="7" data-hover-identifier="react" data-hover-kind="module">react</span>
        <div class="hidden" data-role="tooltip-container"></div>
      </div>
    `;

    afterFileSwapHover();
    initHover();
    const trigger = document.querySelector('[data-refpos]') as HTMLElement;
    const container = document.querySelector('[data-role="tooltip-container"]') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await vi.runAllTimersAsync();

    expect(getTooltipFragment).toHaveBeenCalledWith({
      filePath: 'Imports.ts',
      query: { refPos: 7, identifier: 'react', kind: 'module' },
    });
    expect(container.classList.contains('fixed')).toBe(true);
    expect(container.classList.contains('z-50')).toBe(true);
    expect(container.classList.contains('hidden')).toBe(false);
    expect(container.getAttribute('role')).toBe('tooltip');
    expect(trigger.getAttribute('aria-describedby')).toBe('pseudo-tooltip');
    expect(container.querySelector('[data-role="tooltip-content"]')).not.toBeNull();

    trigger.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(80);
    expect(container.classList.contains('hidden')).toBe(true);
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
    expect(getHoverState()).toEqual({ trigger: null });
  });
});
