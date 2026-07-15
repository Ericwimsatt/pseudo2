import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function IfNode({ node }: { node: SemanticNode }) {
  return <StyledSpan text={`If ${node.metadata.condition}`} variant="kw" />;
}
