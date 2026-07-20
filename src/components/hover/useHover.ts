import { createContext, useContext } from 'react';
import type { HoverContent } from '../../lib/renderable/types';

export interface HoverState {
  hover: HoverContent | null;
  trigger: HTMLElement | null;
  refPos?: number;
  filePath?: string;
}

export interface HoverContextValue {
  hovered: HoverState;
  setHovered: (update: HoverState | null) => void;
  scheduleHide: () => void;
  cancelClear: () => void;
  registerPopupEl: (el: HTMLElement | null) => void;
}

export const EMPTY_HOVER: HoverState = {
  hover: null,
  trigger: null,
};

export const HoverContext = createContext<HoverContextValue | null>(null);

const NOOP_VALUE: HoverContextValue = {
  hovered: EMPTY_HOVER,
  setHovered: () => {},
  scheduleHide: () => {},
  cancelClear: () => {},
  registerPopupEl: () => {},
};

export function useHover(): HoverContextValue {
  const ctx = useContext(HoverContext);
  return ctx ?? NOOP_VALUE;
}
