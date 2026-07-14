import { makeAST } from './src/lib/makeAST';
import { makeSemanticGraph } from './src/lib/makeSemanticGraph';
import { translateGraph } from './src/lib/translationDictionary';
import { buildViewModel } from './src/lib/renderable/viewModel';

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

console.log('\n=== View Model ===');
const vm = buildViewModel(graph1, test1);
for (const line of vm.lines) {
  if (line.nodes.length === 0 && line.spanningBuckets.length === 0) continue;
  console.log(`L${line.lineNumber} bucket=${line.bucket} starts=${line.nodes.length} spans=${line.spanningBuckets.length} rowSpan=${line.translationRowSpan ?? '-'} skip=${line.skipTranslation ?? '-'}`);
  for (const node of line.nodes) {
    console.log(`  - ${node.type} (${node.name ?? ''}) [${node.sourceStartLine}-${node.sourceEndLine}] tokens=${node.tokens.length}`);
  }
}
