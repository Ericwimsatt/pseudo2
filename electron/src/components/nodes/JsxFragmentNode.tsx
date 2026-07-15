import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function JsxFragmentNode({ node: _node }: { node: SemanticNode }) {
  return (
    <>
      <StyledSpan text="<>" variant="punct" />
      <StyledSpan text="…" variant="punct" />
      <StyledSpan text="</>" variant="punct" />
    </>
  );
}
