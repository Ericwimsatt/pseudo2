import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { getReactHookTooltip } from '../../lib/renderable/hover/react';
import { StyledSpan } from './StyledSpan';

export function CallNode({ node }: { node: SemanticNode }) {
  const fn = String(node.metadata.function ?? '');
  const isNew = !!node.metadata.isNew;
  const allArgs = (node.metadata.arguments as string[]) ?? [];
  const displayArgs = allArgs.filter((a) => a !== '<function>');
  const fnCount = allArgs.length - displayArgs.length;
  const verb = isNew ? 'Instantiate' : 'Call';
  let argPart = '';
  if (displayArgs.length > 0 || fnCount > 0) {
    const parts: string[] = [];
    if (displayArgs.length > 0) parts.push(displayArgs.join(', '));
    if (fnCount > 0) parts.push(`${fnCount} function${fnCount > 1 ? 's' : ''}`);
    argPart = ` with ${parts.join(' and ')}`;
  }

  const hookTooltip = getReactHookTooltip(fn);
  const hoverTitle = hookTooltip ? hookTooltip.title : undefined;
  const hoverBody = hookTooltip ? hookTooltip.body : undefined;

  return (
    <>
      <StyledSpan text={`${verb} `} variant="kw" />
      <StyledSpan
        text={fn}
        variant="fn-name"
        hoverTitle={hoverTitle}
        hoverBody={hoverBody}
      />
      {argPart ? <StyledSpan text={argPart} variant="ident" /> : null}
    </>
  );
}
