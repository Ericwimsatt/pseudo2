import type { DisplayNodeData } from '../../../main/translationService/renderable/types';

export interface TreeNode {
  node: DisplayNodeData;
  children: TreeNode[];
}

export function buildTree(nodes: DisplayNodeData[]): TreeNode[] {
  const root: TreeNode[] = [];
  const stack: { tree: TreeNode[]; indent: number }[] = [{ tree: root, indent: -1 }];

  for (const node of nodes) {
    const entry: TreeNode = { node, children: [] };
    while (stack.length > 1 && stack[stack.length - 1].indent >= node.indent) {
      stack.pop();
    }
    stack[stack.length - 1].tree.push(entry);
    stack.push({ tree: entry.children, indent: node.indent });
  }

  return root;
}
