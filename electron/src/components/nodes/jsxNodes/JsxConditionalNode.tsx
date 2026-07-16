import type { SemanticNode } from '../../../lib/makeSemanticGraph';
import { StyledSpan } from '../StyledSpan';

export function JsxConditionalNode({ node }: { node: SemanticNode }) {
  if (node.type === 'jsx-conditional-alt') {
    return <StyledSpan text="Otherwise, render:" variant="kw" />;
  }
  const text =
    node.metadata.variant === 'ternary'
      ? `If ${node.metadata.condition}, render:`
      : `When ${node.metadata.condition}, render:`;
  return <StyledSpan text={text} variant="kw" />;
}
