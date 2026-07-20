import type { DisplayNodeData } from '../../../main/translationService/renderable/types';
import { StyledSpan } from './StyledSpan';

export function PlainNodeLayer({ nodes }: { nodes: DisplayNodeData[] }) {
  if (nodes.length === 0) {
    return <span className="text-gray-300 italic">—</span>;
  }
  return (
    <>
      {nodes.map((node, i) => (
        <span key={i} style={{ paddingLeft: node.indent * 12 }}>
          {node.spans.map((s, j) => (
            <StyledSpan key={j} text={s.text} />
          ))}
        </span>
      ))}
    </>
  );
}
