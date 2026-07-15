import type { SemanticNode } from '../../lib/makeSemanticGraph';
import { ImportNode } from './ImportNode';
import { ExportNode } from './ExportNode';
import { FunctionNode } from './FunctionNode';
import { ClassNode } from './ClassNode';
import { InterfaceNode } from './InterfaceNode';
import { TypeAliasNode } from './TypeAliasNode';
import { PropertyNode } from './PropertyNode';
import { VariableNode } from './VariableNode';
import { ReturnNode } from './ReturnNode';
import { IfNode } from './IfNode';
import { LoopNode } from './LoopNode';
import { CallNode } from './CallNode';
import { JsxElementNode } from './JsxElementNode';
import { JsxFragmentNode } from './JsxFragmentNode';
import { JsxListNode } from './JsxListNode';
import { JsxFilterNode } from './JsxFilterNode';
import { JsxConditionalNode } from './JsxConditionalNode';
import { JsxTextNode } from './JsxTextNode';
import { JsxExpressionNode } from './JsxExpressionNode';

interface Props {
  node: SemanticNode;
}

function FallbackNode({ node }: Props) {
  return <span>{`[${node.type}]`}</span>;
}

const NODE_MAP: Record<string, React.FC<Props>> = {
  import: ImportNode,
  export: ExportNode,
  function: FunctionNode,
  method: FunctionNode,
  class: ClassNode,
  interface: InterfaceNode,
  typeAlias: TypeAliasNode,
  property: PropertyNode,
  variable: VariableNode,
  return: ReturnNode,
  if: IfNode,
  loop: LoopNode,
  call: CallNode,
  'jsx-element': JsxElementNode,
  'jsx-fragment': JsxFragmentNode,
  'jsx-list': JsxListNode,
  'jsx-filter': JsxFilterNode,
  'jsx-conditional': JsxConditionalNode,
  'jsx-conditional-alt': JsxConditionalNode,
  'jsx-text': JsxTextNode,
  'jsx-expression': JsxExpressionNode,
};

function renderNode(node: SemanticNode): React.ReactNode {
  const Component = NODE_MAP[node.type] ?? FallbackNode;
  return <Component node={node} />;
}

interface LayerProps {
  nodes: SemanticNode[];
}

export function NodeLayer({ nodes }: LayerProps) {
  if (nodes.length === 0) {
    return <div className="text-gray-300 italic">—</div>;
  }
  return (
    <div>
      {nodes.map((node, i) => (
        <div
          key={i}
          className="whitespace-pre-wrap break-words"
          style={{ paddingLeft: node.indent * 12 }}
        >
          {renderNode(node)}
        </div>
      ))}
    </div>
  );
}
