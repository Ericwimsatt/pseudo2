import type { LineBoxFragment } from '../../../main/translationService/renderable/types';
import { DisplayNode } from './DisplayNode';

const borderColors = ['#93c5fd', '#86efac', '#fde68a'];
const bgColors = ['#f0f9ff', '#f0fdf4', '#fffbeb'];

interface BoxFragmentProps {
  fragment: LineBoxFragment;
}

export function BoxFragment({ fragment }: BoxFragmentProps) {
  if (!fragment || fragment.layers.length === 0) {
    if (fragment?.contentNode) {
      return (
        <div className="whitespace-pre-wrap break-word leading-5 font-mono text-sm px-4 py-1">
          <DisplayNode node={fragment.contentNode} />
        </div>
      );
    }
    return null;
  }

  const maxDepth = fragment.layers.length > 0
    ? Math.max(...fragment.layers.map(l => l.depth))
    : 0;

  let content = fragment.contentNode
    ? (
      <div className="whitespace-pre-wrap break-words font-mono text-sm px-2 py-0.5" style={{ paddingLeft: maxDepth * 12 }}>
        <DisplayNode node={fragment.contentNode} />
      </div>
    )
    : <div className="select-none min-h-[1.25rem]">&ensp;</div>;

  for (let i = fragment.layers.length - 1; i >= 0; i--) {
    const layer = fragment.layers[i];
    const color = borderColors[layer.depth % borderColors.length];
    const bg = bgColors[layer.depth % bgColors.length];
    const isStart = layer.borderRole === 'start' || layer.borderRole === 'single';
    const isEnd = layer.borderRole === 'end' || layer.borderRole === 'single';

    const borderRadius = isStart && isEnd ? '2px'
      : isStart ? '2px 2px 0 0'
      : isEnd ? '0 0 2px 2px'
      : '0';

    content = (
      <div
        style={{
          borderLeft: `2px solid ${color}`,
          borderTop: isStart ? `2px solid ${color}` : 'none',
          borderBottom: isEnd ? `2px solid ${color}` : 'none',
          borderRight: 'none',
          borderRadius,
          background: bg,
          marginLeft: layer.depth > 0 ? 16 : 0,
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
