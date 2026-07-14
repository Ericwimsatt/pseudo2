import { useEffect, useState } from 'react';
import { useHover } from './useHover';
import { formatMetadata } from '../lib/renderable/hoverContent';

export function HoverPopover() {
  const { hovered, scheduleHide, cancelClear } = useHover();
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!hovered.hover || !hovered.rect) {
      setPos(null);
      return;
    }
    const r = hovered.rect;
    const popW = 320;
    const popH = 160;
    const margin = 8;
    let left = r.left + r.width / 2 - popW / 2;
    let top = r.bottom + margin;
    if (left < margin) left = margin;
    if (left + popW > window.innerWidth - margin) {
      left = window.innerWidth - popW - margin;
    }
    if (top + popH > window.innerHeight - margin) {
      top = r.top - popH - margin;
      if (top < margin) top = margin;
    }
    setPos({ left, top });
  }, [hovered.hover, hovered.rect]);

  if (!hovered.hover || !pos) return null;

  const { hover } = hovered;
  const metaText = formatMetadata(hover.metadata);

  return (
    <div
      className="fixed z-50 max-w-[320px] bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm"
      style={{ left: pos.left, top: pos.top }}
      onMouseEnter={cancelClear}
      onMouseLeave={scheduleHide}
    >
      <div className="font-semibold text-gray-800 mb-1">{hover.title}</div>
      {hover.body && <div className="text-gray-600 mb-1">{hover.body}</div>}
      {metaText && (
        <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono mt-1 pt-1 border-t border-gray-100">
          {metaText}
        </pre>
      )}
    </div>
  );
}
