import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { StyledSpan } from './StyledSpan';

export function LoopNode({ node }: { node: SemanticNode }) {
  const t = node.metadata.loopType as string;
  let text: string;
  if (t === 'forOf') text = 'For each item';
  else if (t === 'forIn') text = 'For each key';
  else text = 'Loop';
  return <StyledSpan text={text} variant="kw" />;
}
