import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { translateType } from '../../lib/renderable/translateType';
import { StyledSpan } from './StyledSpan';

export function PropertyNode({ node }: { node: SemanticNode }) {
  const type = String(node.metadata.type ?? 'any');
  const optional = !!node.metadata.optional;
  const init = node.metadata.initializer as string | null;
  const initText = init ? `, initialized to ${init}` : '';
  return (
    <>
      {optional ? <StyledSpan text="optional, " variant="kw" /> : null}
      <StyledSpan text="`" variant="punct" />
      <StyledSpan text={node.name ?? 'anonymous'} variant="ident" />
      <StyledSpan text="` is " variant="ident" />
      <StyledSpan text={translateType(type)} variant="ident" />
      {initText ? <StyledSpan text={initText} variant="ident" /> : null}
    </>
  );
}
