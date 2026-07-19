import { useEffect, useRef } from 'react';
import { cx } from './styleHelpers';
import { useHover } from '../hover/useHover';
import type { HoverContent } from '../../lib/renderable/types';

interface Props {
  text: string;
  classes?: string[];
  hover?: HoverContent;
  onClick?: (e: React.MouseEvent) => void;
  onHover?: () => void;
}

export function StyledSpan({
  text,
  classes,
  hover,
  onClick,
  onHover,
}: Props) {
  const { setHovered, scheduleHide, cancelClear } = useHover();
  const elRef = useRef<HTMLSpanElement>(null);
  const hoveredRef = useRef(false);

  const handleEnter = () => {
    if (hover && elRef.current) {
      setHovered({ hover, trigger: elRef.current });
      hoveredRef.current = true;
    }
    onHover?.();
  };

  // When enrichment data arrives after the mouse is already inside,
  // push the updated hover to the context so the popover updates live.
  useEffect(() => {
    if (hoveredRef.current && hover && elRef.current) {
      setHovered({ hover, trigger: elRef.current });
    }
  }, [hover, setHovered]);

  const handleLeave = () => {
    hoveredRef.current = false;
    scheduleHide();
  };

  return (
    <span
      ref={elRef}
      className={cx(classes?.join(' '), hover && 'cursor-help underline decoration-dotted underline-offset-2')}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      {text}
    </span>
  );
}
