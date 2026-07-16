import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function FunctionNode({ node }: { node: SemanticNode }) {
  const params = (node.metadata.parameters as string[]) ?? [];
  const paramText = params.length > 0 ? `Parameters: ${params.join(', ')}` : 'No parameters';
  const verb = node.type === 'method' ? 'method' : 'function';
  return (
    <>
      {/* <StyledSpan text={`Define ${verb} `} variant="kw" /> */}
      <StyledSpan text={node.name ?? 'anonymous'} variant="fn-name" />
      <StyledSpan text={`. ${paramText}`} variant="ident" />
    </>
  );
}
