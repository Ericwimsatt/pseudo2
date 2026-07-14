import { useEffect, type RefObject } from 'react';

const MARGIN = 6;
const DISMISS_DELAY_MS = 80;

function pointInRect(x: number, y: number, r: DOMRect | null): boolean {
  if (!r) return false;
  return (
    x >= r.left - MARGIN &&
    x <= r.right + MARGIN &&
    y >= r.top - MARGIN &&
    y <= r.bottom + MARGIN
  );
}

interface UseSafePolygonArgs {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  popupRef: RefObject<HTMLElement | null>;
  onKeepOpen: () => void;
  onDismiss: () => void;
  dismissDelayMs?: number;
}

export function useSafePolygonDismiss({
  open,
  triggerRef,
  popupRef,
  onKeepOpen,
  onDismiss,
  dismissDelayMs = DISMISS_DELAY_MS,
}: UseSafePolygonArgs) {
  useEffect(() => {
    if (!open) return;
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;
    const clearPending = () => {
      if (pendingTimer) {
        clearTimeout(pendingTimer);
        pendingTimer = null;
      }
    };
    const evaluate = (clientX: number, clientY: number) => {
      const tRect = triggerRef.current?.getBoundingClientRect() ?? null;
      const pRect = popupRef.current?.getBoundingClientRect() ?? null;
      if (pointInRect(clientX, clientY, tRect) || pointInRect(clientX, clientY, pRect)) {
        clearPending();
        onKeepOpen();
        return;
      }
      if (pendingTimer) return;
      pendingTimer = setTimeout(() => {
        pendingTimer = null;
        onDismiss();
      }, dismissDelayMs);
    };
    const handlePointerMove = (e: PointerEvent) => evaluate(e.clientX, e.clientY);
    const handlePointerLeave = (e: PointerEvent) => {
      if (e.relatedTarget === null) {
        clearPending();
        onDismiss();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearPending();
        onDismiss();
      }
    };
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerleave', handlePointerLeave);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearPending();
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, triggerRef, popupRef, onKeepOpen, onDismiss, dismissDelayMs]);
}