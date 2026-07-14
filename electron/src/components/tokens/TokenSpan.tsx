import { type MouseEvent } from 'react';
import type { InlineToken } from '../../lib/renderable/types';
import { VARIANT_CLASSES, cx } from '../../lib/renderable/styleHelpers';
import { useHover } from '../useHover';

interface Props {
  token: InlineToken;
  onClick?: (e: MouseEvent) => void;
}

export function TokenSpan({ token, onClick }: Props) {
  const { setHovered } = useHover();
  const variant = token.variant;
  const classes = cx(VARIANT_CLASSES[variant ?? ''], token.classes);

  const handleEnter = (e: MouseEvent<HTMLSpanElement>) => {
    if (token.hover) {
      setHovered({
        hover: token.hover,
        rect: e.currentTarget.getBoundingClientRect(),
      });
    }
  };

  return (
    <span
      className={cx(classes, token.hover && 'cursor-help underline decoration-dotted underline-offset-2')}
      onMouseEnter={handleEnter}
      onClick={onClick}
    >
      {token.text}
    </span>
  );
}
