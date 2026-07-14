import type { NodeRenderable } from '../../lib/renderable/types';
import { TokenSpan } from './TokenSpan';

interface Props {
  nodes: NodeRenderable[];
}

export function TokenLayer({ nodes }: Props) {
  if (nodes.length === 0) {
    return <div className="text-gray-300 italic">—</div>;
  }
  return (
    <div>
      {nodes.map((node, i) => (
        <div
          key={i}
          className="whitespace-pre-wrap break-words"
          style={{ paddingLeft: node.indent * 12 }}
        >
          {node.tokens.map((t, j) => (
            <TokenSpan key={j} token={t} />
          ))}
        </div>
      ))}
    </div>
  );
}