import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function InterfaceNode({ node }: { node: SemanticNode }) {
  return (
    <>
      <StyledSpan text="Define interface " variant="kw" />
      <StyledSpan text={node.name ?? 'anonymous'} variant="fn-name" />
    </>
  );
}
