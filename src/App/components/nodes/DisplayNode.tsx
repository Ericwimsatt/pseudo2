import type { DisplayNodeData } from '../../../main/translationService/renderable/types';
import { StyledSpan } from './StyledSpan';

export function DisplayNode({ node }: { node: DisplayNodeData }) {
  return (
    <>
      {node.spans.map((s, i) => (
        <StyledSpan key={i} text={s.text} refPos={s.refPos} />
      ))}
    </>
  );
}
