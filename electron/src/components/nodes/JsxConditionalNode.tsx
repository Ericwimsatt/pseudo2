import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function JsxConditionalNode({ node }: { node: SemanticNode }) {
  if (node.type === 'jsx-conditional-alt') {
    return <StyledSpan text="Otherwise, show:" variant="kw" />;
  }
  const text =
    node.metadata.variant === 'ternary'
      ? `If ${node.metadata.condition}, show:`
      : `When ${node.metadata.condition}, show:`;
  return <StyledSpan text={text} variant="kw" />;
}
