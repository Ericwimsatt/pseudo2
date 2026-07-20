import { useEffect, useRef, useContext } from 'react';
import { cx } from './styleHelpers';
import { useHover } from '../hover/useHover';
import type { HoverContent } from '../../lib/renderable/types';
import { SearchContext } from '../../lib/searchContext';
import { FilePathContext } from '../../lib/filePathContext';

interface Props {
  text: string;
  classes?: string[];
  hover?: HoverContent;
  onClick?: (e: React.MouseEvent) => void;
  onHover?: () => void;
  refPos?: number;
}

function highlightText(text: string, term: string, isActive: boolean) {
  if (!term) return text;
  const lower = text.toLowerCase();
  const termLower = term.toLowerCase();
  const parts: { t: string; match: boolean }[] = [];
  let lastIndex = 0;
  let index = lower.indexOf(termLower);
  while (index !== -1) {
    if (index > lastIndex) {
      parts.push({ t: text.slice(lastIndex, index), match: false });
    }
    parts.push({ t: text.slice(index, index + term.length), match: true });
    lastIndex = index + term.length;
    index = lower.indexOf(termLower, lastIndex);
  }
  if (lastIndex < text.length) {
    parts.push({ t: text.slice(lastIndex), match: false });
  }
  return parts.map((p, i) =>
    p.match ? (
      <mark
        key={i}
        className={cx(
          'rounded-sm',
          isActive ? 'bg-yellow-300 text-black' : 'bg-yellow-100 text-black'
        )}
      >
        {p.t}
      </mark>
    ) : (
      <span key={i}>{p.t}</span>
    )
  );
}

export function StyledSpan({
  text,
  classes,
  hover,
  onClick,
  onHover,
  refPos,
}: Props) {
  const { setHovered, scheduleHide, cancelClear } = useHover();
  const searchCtx = useContext(SearchContext);
  const filePath = useContext(FilePathContext);
  const elRef = useRef<HTMLSpanElement>(null);
  const hoveredRef = useRef(false);
  const hasTooltip = !!(hover || refPos !== undefined);

  const handleEnter = () => {
    if (hasTooltip && elRef.current) {
      setHovered({ hover: hover ?? { title: '' }, trigger: elRef.current, refPos, filePath });
      hoveredRef.current = true;
    }
    onHover?.();
  };

  useEffect(() => {
    if (hoveredRef.current && hasTooltip && elRef.current) {
      setHovered({ hover: hover ?? { title: '' }, trigger: elRef.current, refPos, filePath });
    }
  }, [hover, refPos, setHovered, filePath]);

  const handleLeave = () => {
    hoveredRef.current = false;
    scheduleHide();
  };

  return (
    <span
      ref={elRef}
      className={cx(classes?.join(' '), hasTooltip && 'cursor-help underline decoration-dotted underline-offset-2')}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      {searchCtx.term ? highlightText(text, searchCtx.term, searchCtx.isActiveMatch) : text}
    </span>
  );
}
