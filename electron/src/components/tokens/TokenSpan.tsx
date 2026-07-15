import { type MouseEvent, useRef } from 'react';
import type { InlineToken } from '../../lib/renderable/types';
import { VARIANT_CLASSES, cx } from '../../lib/renderable/styleHelpers';
import { useHover } from '../../lib/renderable/hover/useHover';

interface Props {
  token: InlineToken;
  onClick?: (e: MouseEvent) => void;
}

export function TokenSpan({ token, onClick }: Props) {
  const { setHovered, scheduleHide } = useHover();
  const elRef = useRef<HTMLSpanElement>(null);
  const variant = token.variant;
  const classes = cx(VARIANT_CLASSES[variant ?? ''], token.classes);

  const handleEnter = () => {
    if (token.hover && elRef.current) {
      setHovered({
        hover: token.hover,
        trigger: elRef.current,
      });
    }
  };

  return (
    <span
      ref={elRef}
      className={cx(classes, token.hover && 'cursor-help underline decoration-dotted underline-offset-2')}
      onMouseEnter={handleEnter}
      onMouseLeave={scheduleHide}
      onClick={onClick}
    >
      {token.text}
    </span>
  );
}