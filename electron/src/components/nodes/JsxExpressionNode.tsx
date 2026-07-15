import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function JsxExpressionNode({ node }: { node: SemanticNode }) {
  if (node.metadata.isTemplate) {
    return <StyledSpan text={`Show dynamic text: ${node.metadata.expression}`} variant="ident" />;
  }
  return <StyledSpan text={`Show: ${node.metadata.expression}`} variant="ident" />;
}
