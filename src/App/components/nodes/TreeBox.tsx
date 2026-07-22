import type { DisplayNodeData } from '../../../main/translationService/renderable/types';
import { DisplayNode } from './DisplayNode';

interface TreeBoxProps {
  node: DisplayNodeData;
  depth: number;
  isLast: boolean;
}

export function TreeBox({ node, depth, isLast }: TreeBoxProps) {
  const hasChildren = node.children.length > 0;

  const borderColors = ['#93c5fd', '#86efac', '#fde68a'];
  const bgColors = ['#f0f9ff', '#f0fdf4', '#fffbeb'];
  const color = borderColors[Math.min(depth, borderColors.length - 1)];
  const bg = bgColors[Math.min(depth, bgColors.length - 1)];

  if (!hasChildren) {
    return (
      <div
        className="whitespace-pre-wrap break-words leading-5"
        style={{ paddingLeft: depth > 0 ? 16 : 0 }}
      >
        <DisplayNode node={node} />
      </div>
    );
  }

  return (
    <div
      className="rounded-sm"
      style={{
        border: `2px solid ${color}`,
        borderBottom: isLast ? `2px solid ${color}` : 'none',
        margin: '2px 0',
        marginLeft: depth > 0 ? 16 : 0,
        background: bg,
      }}
      data-tree-depth={depth}
    >
      <div className="px-2 py-0.5 leading-5 min-h-[1.25rem] whitespace-pre-wrap break-words font-mono text-sm">
        <DisplayNode node={node} />
      </div>
      {hasChildren && (
        <div className="flex flex-col">
          {node.children.map((child, i) => (
            <TreeBox
              key={i}
              node={child}
              depth={depth + 1}
              isLast={i === node.children.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
