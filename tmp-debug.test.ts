import { it } from 'vitest';
import { buildFileData } from '../src/main/translationService/buildFileData';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const source = readFileSync(resolve(__dirname, 'test/fixtures/repos/irl/use-toast.ts'), 'utf-8');

it('debug useToast lines 166-184', () => {
  const { viewModel } = buildFileData(source, 'use-toast.ts');
  for (let i = 165; i < 184; i++) {
    const line = viewModel.lines[i];
    const frag = line.boxFragment;
    const cn = frag?.contentNode;
    let txt = cn ? cn.spans.map(s=>s.text).join('') : '(empty)';
    txt = txt.replace(/\n/g, '\\n');
    console.log(`${i+1} [${line.bucket}] layers=${frag?.layers?.length??0} :: ${txt}`);
  }
});
