import { useCallback, useContext, useRef, useState } from 'react';
import type { DisplaySpan, TooltipData } from '../../lib/renderable/types';
import { FilePathContext } from '../../lib/filePathContext';
import { StyledSpan } from './StyledSpan';

interface Props {
  span: DisplaySpan;
}

function useTooltipData(refPos: number | undefined, hasHover: boolean | undefined) {
  const filePath = useContext(FilePathContext);
  const [sections, setSections] = useState<TooltipData['sections'] | null>(null);
  const [loading, setLoading] = useState(false);
  const askedRef = useRef(false);

  const onHover = useCallback(() => {
    if (!hasHover || refPos === undefined) return;
    if (askedRef.current) return;
    askedRef.current = true;

    setLoading(true);

    window.electronAPI.getNodeDetail({ filePath, query: { refPos } })
      .then((answer: TooltipData) => {
        setSections(answer.sections);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [hasHover, refPos, filePath]);

  return { sections, loading, onHover };
}

export function EnrichedSpan({ span }: Props) {
  const { sections, loading, onHover } = useTooltipData(span.refPos, span.hasHover);
  const hasData = span.hasHover && (loading || sections !== null);

  let hover = span.hover;
  if (hasData) {
    hover = {
      title: span.hover?.title ?? '',
      loading,
      sections: sections ?? undefined,
    };
  }

  return <StyledSpan text={span.text} hover={hover} onHover={onHover} />;
}
