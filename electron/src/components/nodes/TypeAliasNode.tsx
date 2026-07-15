import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function TypeAliasNode({ node }: { node: SemanticNode }) {
  return (
    <>
      <StyledSpan text="Define type " variant="kw" />
      <StyledSpan text={node.name ?? 'anonymous'} variant="fn-name" />
      <StyledSpan text=" as " variant="ident" />
      <StyledSpan text={String(node.metadata.type ?? '')} variant="ident" />
    </>
  );
}
