import type { DisplayNodeData } from '../../../main/translationService/renderable/types';
import { buildTree } from './buildTree';
import { TreeBox } from './TreeBox';

interface LayerProps {
  nodes: DisplayNodeData[];
}

export function NodeLayer({ nodes }: LayerProps) {
  if (nodes.length === 0) {
    return <div className="text-gray-300 italic">—</div>;
  }

  const tree = buildTree(nodes);

  return (
    <div>
      {tree.map((tn, i) => (
        <TreeBox
          key={i}
          treeNode={tn}
          depth={0}
          isLast={i === tree.length - 1}
        />
      ))}
    </div>
  );
}
