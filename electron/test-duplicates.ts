import { makeAST } from './src/lib/makeAST';
import { makeSemanticGraph } from './src/lib/makeSemanticGraph';
import { translateGraph } from './src/lib/translationDictionary';

const test1 = `
function App() {
  return (
    <div>
      <span>Hello</span>
    </div>
  );
}
`;

const ast1 = makeAST(test1, 'test.tsx');
const graph1 = makeSemanticGraph(ast1);

console.log('=== Semantic Graph ===');
function dumpGraph(nodes, depth = 0) {
  for (const node of nodes) {
    console.log(`${'  '.repeat(depth)}${node.type} (${node.name || ''}) [indent=${node.indent}] [lines=${node.sourceStartLine}-${node.sourceEndLine}]`);
    if (node.children.length > 0) {
      dumpGraph(node.children, depth + 1);
    }
  }
}
dumpGraph(graph1);

console.log('\n=== Translations ===');
const translations1 = translateGraph(graph1);
for (const line in translations1) {
  for (const item of translations1[line]) {
    console.log(`L${line}: ${item.text} (ends at L${item.endLine})`);
  }
}
