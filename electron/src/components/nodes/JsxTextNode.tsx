import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function JsxTextNode({ node }: { node: SemanticNode }) {
  const text = String(node.metadata.text);
  const display = text.length > 60 ? `${text.slice(0, 57)}...` : text;
  return <StyledSpan text={`Show text: "${display}"`} variant="string" />;
}
