import type { SemanticNode } from '../../../lib/makeSemanticGraph';
import { StyledSpan } from '../StyledSpan';

export function JsxExpressionNode({ node }: { node: SemanticNode }) {
  if (node.metadata.isTemplate) {
    return <StyledSpan text={`Dynamic text: ${node.metadata.expression}`} variant="ident" />;
  }
  return <StyledSpan text={`Text: ${node.metadata.expression}`} variant="ident" />;
}
