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
import { formatMetadata } from '../../lib/renderable/hover';
import { TooltipContent } from './TooltipContent';

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

  const { hover } = hovered;
  const metaText = formatMetadata(hover.metadata);

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
        {hover.loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </div>
        ) : hover.sections ? (
          <div>
            {hover.title && (
              <div className="font-semibold text-gray-800 mb-1">{hover.title}</div>
            )}
            <TooltipContent sections={hover.sections} />
          </div>
        ) : (
          <>
            {hover.title && (
              <div className="font-semibold text-gray-800 mb-1">{hover.title}</div>
            )}
            {hover.body && <div className="text-gray-600 mb-1 whitespace-pre-wrap">{hover.body}</div>}
            {metaText && (
              <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono mt-1 pt-1 border-t border-gray-100">
                {metaText}
              </pre>
            )}
          </>
        )}
      </div>
    </FloatingPortal>
  );
}
