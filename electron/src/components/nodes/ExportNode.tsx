import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function ExportNode({ node }: { node: SemanticNode }) {
  const names = String(node.name ?? '');
  const module = String(node.metadata.module ?? '');
  const verb = names.includes(',') ? 'are' : 'is';
  if (module) {
    return (
      <>
        <StyledSpan text="export " variant="kw" />
        <StyledSpan text={names} variant="ident" />
        <StyledSpan text={` ${verb} re-exported from `} variant="ident" />
        <StyledSpan
          text={module}
          variant="string"
          hoverTitle="Module"
          hoverBody={module}
        />
      </>
    );
  }
  return (
    <>
      <StyledSpan text="export " variant="kw" />
      <StyledSpan text={names} variant="ident" />
      <StyledSpan text={` ${verb} exported`} variant="ident" />
    </>
  );
}
