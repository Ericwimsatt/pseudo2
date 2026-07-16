import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { getReactHookTooltip } from '../../lib/renderable/hover/react';
import { StyledSpan } from './StyledSpan';

function joinNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export function VariableNode({ node }: { node: SemanticNode }) {
  const destructured = node.metadata.destructured as boolean | undefined;
  const names = node.metadata.names as string[] | undefined;
  const callInfo = node.metadata.initializerCall as Record<string, any> | undefined;
  const init = node.metadata.initializer as string | null;

  if (destructured && names) {
    const namesText = joinNames(names);

    if (callInfo) {
      const fn = String(callInfo.function ?? '');
      const isNew = !!callInfo.isNew;
      const args = (callInfo.arguments as string[]) ?? [];
      const verb = isNew ? 'instantiating' : 'calling';
      const argsText = args.length > 0 ? `(${args.join(', ')})` : '';
      const hookTooltip = getReactHookTooltip(fn);
      return (
        <>
          <StyledSpan text={namesText} variant="ident" />
          <StyledSpan text=" = " variant="punct" />
          <StyledSpan text={`the result of ${verb} `} variant="kw" />
          <StyledSpan
            text={`${fn}${argsText}`}
            variant="fn-name"
            hoverTitle={hookTooltip?.title}
            hoverBody={hookTooltip?.body}
          />
        </>
      );
    }

    return (
      <>
        <StyledSpan text={namesText} variant="ident" />
        <StyledSpan text=" = " variant="punct" />
        {init ? <StyledSpan text={init} variant="ident" /> : null}
      </>
    );
  }

  return (
    <>
      <StyledSpan text={node.name ?? 'anonymous'} variant="ident" />
      <StyledSpan text=" = " variant="punct" />
      {init ? <StyledSpan text={init} variant="ident" /> : null}
    </>
  );
}
