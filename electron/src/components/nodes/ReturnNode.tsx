import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function ReturnNode({ node }: { node: SemanticNode }) {
  if (node.metadata.hasJsx) {
    return <StyledSpan text="Render" variant="kw" />;
  }
  const value = node.metadata.value as string | null;
  if (value) {
    return (
      <>
        <StyledSpan text="return " variant="kw" />
        <StyledSpan text="`" variant="punct" />
        <StyledSpan text={value} variant="ident" />
        <StyledSpan text="`" variant="punct" />
      </>
    );
  }
  return <StyledSpan text="return" variant="kw" />;
}
