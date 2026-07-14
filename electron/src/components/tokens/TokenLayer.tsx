import type { MouseEvent } from 'react';
import type { NodeRenderable } from '../../lib/renderable/types';
import { TokenSpan } from './TokenSpan';
import { useHover } from '../useHover';

interface Props {
  nodes: NodeRenderable[];
}

export function TokenLayer({ nodes }: Props) {
  const { setHovered, scheduleHide, cancelClear } = useHover();
  if (nodes.length === 0) {
    return <div className="text-gray-300 italic">—</div>;
  }
  const onEnter = (_e: MouseEvent<HTMLDivElement>, node: NodeRenderable) => {
    cancelClear();
    setHovered({
      sourceStartLine: node.sourceStartLine,
      sourceEndLine: node.sourceEndLine,
    });
  };
  const onLeave = () => {
    scheduleHide();
  };
  return (
    <div>
      {nodes.map((node, i) => (
        <div
          key={i}
          className="whitespace-pre-wrap break-words"
          style={{ paddingLeft: node.indent * 12 }}
          onMouseEnter={(e) => onEnter(e, node)}
          onMouseLeave={onLeave}
        >
          {node.tokens.map((t, j) => (
            <TokenSpan key={j} token={t} />
          ))}
        </div>
      ))}
    </div>
  );
}
