import type { DisplayNodeData } from '../../../main/translationService/renderable/types';
import { TreeBox } from './TreeBox';

interface LayerProps {
  nodes: DisplayNodeData[];
}

export function NodeLayer({ nodes }: LayerProps) {
  if (nodes.length === 0) {
    return <div className="text-gray-300 italic">—</div>;
  }

  return (
    <div>
      {nodes.map((tn, i) => (
        <TreeBox
          key={i}
          node={tn}
          depth={0}
          isLast={i === nodes.length - 1}
        />
      ))}
    </div>
  );
}
