import { readFile } from 'fs/promises';
import { join } from 'path';
import { setRepoPath, clearCache } from '../src/main/translationService/cache/projectCache.ts';
import { buildFileData } from '../src/main/translationService/buildFileData.ts';

clearCache();
setRepoPath(join(process.cwd(), 'test/fixtures/repos/irl'));
const sourceCode = await readFile(join(process.cwd(), 'test/fixtures/repos/irl/use-toast.ts'), 'utf-8');
const { viewModel } = buildFileData(sourceCode, 'use-toast.ts');
for (const line of viewModel.lines) {
  console.log(`--- line ${line.lineNumber} bucket=${line.bucket} nodes=${line.nodes.length} box=${line.boxFragment ? 'yes' : 'no'} ---`);
  console.log(`  source: ${line.sourceText}`);
  console.log(`  nodes:`);
  for (const n of line.nodes) renderNode(n, 2);
  if (line.boxFragment && line.boxFragment.contentNode) {
    console.log(`  box content:`);
    renderNode(line.boxFragment.contentNode, 2);
  }
}
function renderNode(n, depth) {
  const pad = '  '.repeat(depth);
  console.log(`${pad}- [${n.sourceStartLine}-${n.sourceEndLine}] bucket=${n.bucket} nested=${n.nested} closeText=${JSON.stringify(n.closeText)}`);
  for (const s of n.spans) console.log(`${pad}  span: ${JSON.stringify(s.text)}`);
  for (const c of n.children) renderNode(c, depth + 1);
}
