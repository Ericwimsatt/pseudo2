import { useRef } from 'react';
import type { NodeVariant } from '../../lib/renderable/types';
import { VARIANT_CLASSES, cx } from '../../lib/renderable/styleHelpers';
import { useHover } from '../../lib/renderable/hover/useHover';
import { buildHover } from '../../lib/renderable/hover/Tooltip';

interface Props {
  text: string;
  variant?: NodeVariant;
  classes?: string[];
  hoverTitle?: string;
  hoverBody?: string;
  hoverMeta?: Record<string, unknown>;
  onClick?: (e: React.MouseEvent) => void;
}

export function StyledSpan({
  text,
  variant,
  classes,
  hoverTitle,
  hoverBody,
  hoverMeta,
  onClick,
}: Props) {
  const { setHovered, scheduleHide } = useHover();
  const elRef = useRef<HTMLSpanElement>(null);
  const variantClasses = VARIANT_CLASSES[variant ?? ''];
  const finalClasses = cx(variantClasses, classes);

  let hover = undefined;
  if (hoverTitle || hoverBody || hoverMeta) {
    hover = buildHover(hoverTitle ?? '', hoverBody, hoverMeta);
  }

  const handleEnter = () => {
    if (hover && elRef.current) {
      setHovered({ hover, trigger: elRef.current });
    }
  };

  return (
    <span
      ref={elRef}
      className={cx(finalClasses, hover && 'cursor-help underline decoration-dotted underline-offset-2')}
      onMouseEnter={handleEnter}
      onMouseLeave={scheduleHide}
      onClick={onClick}
    >
      {text}
    </span>
  );
}
