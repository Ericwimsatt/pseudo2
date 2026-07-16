import type { SemanticNode } from '../../../lib/makeSemanticGraph';
import { StyledSpan } from '../StyledSpan';

export function JsxFilterNode({ node }: { node: SemanticNode }) {
  return (
    <StyledSpan
      text={`Filter ${node.metadata.collection} where ${node.metadata.condition}:`}
      variant="kw"
    />
  );
}
