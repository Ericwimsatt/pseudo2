import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function ClassNode({ node }: { node: SemanticNode }) {
  const extendsText = node.metadata.extends ? ` (extends ${node.metadata.extends})` : '';
  return (
    <>
      <StyledSpan text="Define class " variant="kw" />
      <StyledSpan text={node.name ?? 'anonymous'} variant="fn-name" />
      {extendsText ? <StyledSpan text={extendsText} variant="ident" /> : null}
    </>
  );
}
