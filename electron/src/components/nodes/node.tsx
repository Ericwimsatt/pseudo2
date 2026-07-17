import type { DisplayNodeData } from '../../lib/renderable/types';
import { StyledSpan } from './StyledSpan';

export function DisplayNode({ node }: { node: DisplayNodeData }) {
  return (
    <>
      {node.spans.map((s, i) => (
        <StyledSpan key={i} text={s.text} hover={s.hover} />
      ))}
    </>
  );
}
