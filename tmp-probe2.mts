import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { setRepoPath, clearCache } from './src/main/translationService/cache/projectCache.ts';
import { buildFileData } from './src/main/translationService/buildFileData.ts';
import { makeSemanticGraph } from './src/main/translationService/makeSemanticGraph.ts';
import { Project } from 'ts-morph';

clearCache();
setRepoPath(join(process.cwd(), 'test', 'fixtures', 'repos', 'irl'));
const source = await readFile(join(process.cwd(), 'test', 'fixtures', 'repos', 'irl', 'use-toast.ts'), 'utf-8');

const project = new Project({ useInMemoryFileSystem: true });
const sf = project.createSourceFile('use-toast.ts', source);
const graph = makeSemanticGraph(sf);

for (const n of graph) {
  if (n.name === 'Action' && n.type === 'typeAlias') {
    console.log('NODE:', n.name, n.type);
    console.log('sourceStartLine:', n.sourceStartLine, 'end:', n.sourceEndLine);
    console.log('metadata.type escapes:');
    console.log(JSON.stringify(n.metadata.type));
  }
}

const { viewModel } = buildFileData(source, 'use-toast.ts');
for (let i = 30; i < 57; i++) {
  const line = viewModel.lines[i];
  if (!line) break;
  const node = line.boxFragment?.contentNode;
  const text = node ? node.spans.map((s: any) => s.text).join('') : '(no content)';
  console.log(`L${i+1}: ${JSON.stringify(text)}`);
}
