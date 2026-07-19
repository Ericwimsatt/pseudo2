import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { DisplaySpan, QueryAnswer, EnrichQuery } from '../../lib/renderable/types';
import { FilePathContext } from '../../lib/filePathContext';
import { StyledSpan } from './StyledSpan';

interface Props {
  span: DisplaySpan;
}

function renderAnswer(answer: QueryAnswer): string | null {
  switch (answer.kind) {
    case 'definition':
      if (!answer.data) return null;
      return `Defined at line ${answer.data.line}: ${answer.data.text}`;
    case 'references':
      if (answer.data.list.length === 0) return null;
      const writes = answer.data.list.filter((r) => r.isWrite);
      const reads = answer.data.list.filter((r) => !r.isWrite);
      const parts: string[] = [];
      if (reads.length) parts.push(`Used: line ${reads.map((r) => r.line).join(', ')}`);
      if (writes.length) parts.push(`Modified: line ${writes.map((r) => r.line).join(', ')}`);
      return parts.join('\n');
    case 'type':
      if (!answer.data) return null;
      return `Type: ${answer.data.text}`;
  }
}

function useEnrichment(refPos: number | undefined, staticHover: import('../../lib/renderable/types').HoverContent | undefined) {
  const filePath = useContext(FilePathContext);
  const [answers, setAnswers] = useState<Map<string, QueryAnswer>>(new Map());
  const [loading, setLoading] = useState(false);
  const askedRef = useRef<Set<string>>(new Set());
  const hasRef = refPos !== undefined && refPos !== 0;

  const onHover = useCallback(() => {
    if (!hasRef) return;

    const asked = askedRef.current;
    if (asked.size > 0) return;

    // Show "Looking up..." immediately on first hover
    setLoading(true);

    const queries: EnrichQuery[] = [
      { kind: 'definition', refPos: refPos! },
      { kind: 'references', refPos: refPos! },
      { kind: 'type', refPos: refPos! },
    ];

    for (const q of queries) {
      const key = q.kind;
      if (asked.has(key)) continue;
      asked.add(key);

      window.electronAPI.ask(filePath, q).then((answer: QueryAnswer) => {
        setAnswers((prev) => {
          const next = new Map(prev);
          next.set(key, answer);
          if (next.size === queries.length) setLoading(false);
          return next;
        });
      }).catch(() => {
        setAnswers((prev) => {
          const next = new Map(prev);
          setLoading(false);
          return next;
        });
      });
    }
  }, [hasRef, refPos, filePath]);

  const hoverContent = useMemo(() => {
    const bodyParts: string[] = [];

    if (loading && answers.size === 0) {
      bodyParts.push('Looking up...');
    }

    if (staticHover?.body) bodyParts.push(staticHover.body);

    for (const answer of answers.values()) {
      const line = renderAnswer(answer);
      if (line) bodyParts.push(line);
    }

    if (bodyParts.length === 0 && !staticHover) {
      return hasRef ? { title: '', body: '' } : undefined;
    }

    return {
      title: staticHover?.title ?? '',
      body: bodyParts.join('\n'),
    };
  }, [staticHover, answers, loading, hasRef]);

  return { hoverContent, onHover };
}

export function EnrichedSpan({ span }: Props) {
  const { hoverContent, onHover } = useEnrichment(span.refPos, span.hover);
  return <StyledSpan text={span.text} hover={hoverContent} onHover={onHover} />;
}
