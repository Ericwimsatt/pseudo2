import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function VariableNode({ node }: { node: SemanticNode }) {
  const init = node.metadata.initializer as string | null;
  return (
    <>
      <StyledSpan text="Declare variable " variant="kw" />
      <StyledSpan text="`" variant="punct" />
      <StyledSpan text={node.name ?? 'anonymous'} variant="ident" />
      <StyledSpan text="`" variant="punct" />
      {init ? (
        <>
          <StyledSpan text=" = " variant="ident" />
          <StyledSpan text={init} variant="ident" />
        </>
      ) : null}
    </>
  );
}
