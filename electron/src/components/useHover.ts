import { createContext, useContext } from 'react';
import type { HoverContent } from '../lib/renderable/types';

export interface HoverState {
  hover: HoverContent | null;
  rect: DOMRect | null;
  sourceStartLine: number;
  sourceEndLine: number;
}

export interface HoverContextValue {
  hovered: HoverState;
  setHovered: (update: Partial<HoverState> | null) => void;
  scheduleHide: () => void;
  cancelClear: () => void;
}

export const EMPTY_HOVER: HoverState = {
  hover: null,
  rect: null,
  sourceStartLine: 0,
  sourceEndLine: 0,
};

export const HoverContext = createContext<HoverContextValue | null>(null);

const NOOP_VALUE: HoverContextValue = {
  hovered: EMPTY_HOVER,
  setHovered: () => {},
  scheduleHide: () => {},
  cancelClear: () => {},
};

export function useHover(): HoverContextValue {
  const ctx = useContext(HoverContext);
  return ctx ?? NOOP_VALUE;
}
