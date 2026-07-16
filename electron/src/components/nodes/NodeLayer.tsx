import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { DisplayNode } from './node';

interface LayerProps {
  nodes: SemanticNode[];
}

export function NodeLayer({ nodes }: LayerProps) {
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
          <DisplayNode node={node} />
        </div>
      ))}
    </div>
  );
}
