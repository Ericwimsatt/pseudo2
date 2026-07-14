import { useRef, useState, useCallback, type ReactNode, type Context } from 'react';
import { EMPTY_HOVER, type HoverContextValue, type HoverState } from './useHover';

interface ProviderProps {
  context: Context<HoverContextValue | null>;
  children: ReactNode;
  hideDelayMs?: number;
}

export function HoverProvider({ context: Ctx, children, hideDelayMs = 250 }: ProviderProps) {
  const [hovered, setHoveredState] = useState<HoverState>(EMPTY_HOVER);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClear = useCallback(() => {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
  }, []);

  const setHovered = useCallback(
    (update: Partial<HoverState> | null) => {
      cancelClear();
      if (update === null) {
        setHoveredState(EMPTY_HOVER);
      } else {
        setHoveredState((prev) => ({ ...prev, ...update }));
      }
    },
    [cancelClear]
  );

  const scheduleHide = useCallback(() => {
    cancelClear();
    clearTimer.current = setTimeout(() => {
      setHoveredState(EMPTY_HOVER);
      clearTimer.current = null;
    }, hideDelayMs);
  }, [cancelClear, hideDelayMs]);

  return (
    <Ctx.Provider value={{ hovered, setHovered, scheduleHide, cancelClear }}>
      {children}
    </Ctx.Provider>
  );
}
