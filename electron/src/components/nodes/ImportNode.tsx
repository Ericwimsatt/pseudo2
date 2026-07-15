import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function ImportNode({ node }: { node: SemanticNode }) {
  const names = String(node.name ?? '');
  const module = String(node.metadata.module ?? '');
  const verb = names.includes(',') ? 'are imported from' : 'is imported from';
  return (
    <>
      <StyledSpan text="import " variant="kw" />
      <StyledSpan text={names} variant="ident" />
      <StyledSpan text={` ${verb} `} variant="ident" />
      <StyledSpan
        text={module}
        variant="string"
        hoverTitle="Module"
        hoverBody={module}
      />
    </>
  );
}
