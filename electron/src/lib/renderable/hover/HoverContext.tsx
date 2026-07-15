import { useRef, useState, useCallback, type ReactNode, type Context } from 'react';
import { EMPTY_HOVER, type HoverContextValue, type HoverState } from './useHover';

interface ProviderProps {
  context: Context<HoverContextValue | null>;
  children: ReactNode;
}

export function HoverProvider({ context: Ctx, children }: ProviderProps) {
  const [hovered, setHoveredState] = useState<HoverState>(EMPTY_HOVER);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupElRef = useRef<HTMLElement | null>(null);

  const cancelClear = useCallback(() => {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
  }, []);

  const setHovered = useCallback(
    (update: HoverState | null) => {
      cancelClear();
      if (update === null) {
        setHoveredState(EMPTY_HOVER);
      } else {
        setHoveredState(update);
      }
    },
    [cancelClear]
  );

  const scheduleHide = useCallback(() => {
    cancelClear();
    clearTimer.current = setTimeout(() => {
      setHoveredState(EMPTY_HOVER);
      clearTimer.current = null;
    }, 60);
  }, [cancelClear]);

  const registerPopupEl = useCallback((el: HTMLElement | null) => {
    popupElRef.current = el;
  }, []);

  return (
    <Ctx.Provider value={{ hovered, setHovered, scheduleHide, cancelClear, registerPopupEl }}>
      {children}
    </Ctx.Provider>
  );
}
