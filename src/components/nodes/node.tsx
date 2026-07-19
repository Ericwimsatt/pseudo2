import type { DisplayNodeData } from '../../lib/renderable/types';
import { EnrichedSpan } from './EnrichedSpan';

export function DisplayNode({ node }: { node: DisplayNodeData }) {
  return (
    <>
      {node.spans.map((s, i) => (
        <EnrichedSpan key={i} span={s} />
      ))}
    </>
  );
}
