import { join } from 'path';
import { readFile } from 'fs/promises';
import type { SourceLine } from '../../shared/api';
import { getRepoPath } from '../translationService/cache/projectCache';

export async function loadFileSource(arg: { path: string }): Promise<{ path: string; lines: SourceLine[] }> {
  const rp = getRepoPath();
  if (!rp) {
    throw new Error('No repository loaded');
  }

  const fullPath = join(rp, arg.path);
  const sourceCode = await readFile(fullPath, 'utf-8');
  const lines = sourceCode.split('\n').map((text, i) => ({
    lineNumber: i + 1,
    text,
  }));

  return { path: arg.path, lines };
}
