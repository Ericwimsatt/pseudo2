import { useEffect, useRef, useState } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  FloatingPortal,
  type ReferenceType,
} from '@floating-ui/react';
import { useHover } from './useHover';
import { useSafePolygonDismiss } from './useSafePolygonDismiss';
import { ToolTip } from './ToolTip';

export function HoverPopover() {
  const { hovered, scheduleHide, cancelClear, registerPopupEl } = useHover();
  const popRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setReference((hovered.trigger as ReferenceType | null) ?? null);
    setOpen(!!hovered.hover && !!hovered.trigger);
  }, [hovered.hover, hovered.trigger, refs]);

  useEffect(() => {
    const el = popRef.current;
    registerPopupEl(el);
    return () => registerPopupEl(null);
  }, [open, registerPopupEl]);

  useSafePolygonDismiss({
    open,
    triggerRef: refs.reference as React.RefObject<HTMLElement | null>,
    popupRef: popRef,
    onKeepOpen: cancelClear,
    onDismiss: scheduleHide,
  });

  if (!open || !hovered.hover) return null;

  return (
    <FloatingPortal>
      <div
        ref={(node) => {
          popRef.current = node;
          refs.setFloating(node);
        }}
        className="fixed z-50 max-w-md bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm"
        style={floatingStyles}
        onMouseEnter={cancelClear}
        onMouseLeave={scheduleHide}
      >
        <ToolTip hover={hovered.hover} refPos={hovered.refPos} filePath={hovered.filePath} />
      </div>
    </FloatingPortal>
  );
}
