import { useRef } from 'react';
import { cx } from './styleHelpers';
import { useHover } from '../hover/useHover';
import type { HoverContent } from '../../lib/renderable/types';

interface Props {
  text: string;
  classes?: string[];
  hover?: HoverContent;
  onClick?: (e: React.MouseEvent) => void;
}

export function StyledSpan({
  text,
  classes,
  hover,
  onClick,
}: Props) {
  const { setHovered, scheduleHide } = useHover();
  const elRef = useRef<HTMLSpanElement>(null);

  const handleEnter = () => {
    if (hover && elRef.current) {
      setHovered({ hover, trigger: elRef.current });
    }
  };

  return (
    <span
      ref={elRef}
      className={cx(classes?.join(' '), hover && 'cursor-help underline decoration-dotted underline-offset-2')}
      onMouseEnter={handleEnter}
      onMouseLeave={scheduleHide}
      onClick={onClick}
    >
      {text}
    </span>
  );
}
