import type { SemanticNode } from '../../../lib/makeSemanticGraph';
import { StyledSpan } from '../StyledSpan';

export function JsxListNode({ node }: { node: SemanticNode }) {
  return (
    <StyledSpan
      text={`For each ${node.metadata.itemName} in ${node.metadata.collection}:`}
      variant="kw"
    />
  );
}
