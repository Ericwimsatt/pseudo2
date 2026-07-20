import { join } from 'path';
import { readFile } from 'fs/promises';
import type { SourceLine } from '../../shared/api';
import type { ViewModel } from '../../lib/renderable/types';
import { buildFileData } from '../../lib/buildFileData';
import { buildViewModel } from '../../lib/renderable/viewModel';
import { getRepoPath, setCache } from '../cache/projectCache';

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

export async function loadFileTranslation(arg: { path: string }): Promise<{ path: string; viewModel: ViewModel }> {
  const rp = getRepoPath();
  if (!rp) {
    throw new Error('No repository loaded');
  }

  const fullPath = join(rp, arg.path);
  const sourceCode = await readFile(fullPath, 'utf-8');

  const isTranslatable = arg.path.endsWith('.ts') || arg.path.endsWith('.tsx');

  if (isTranslatable) {
    const result = buildFileData(sourceCode, arg.path);
    setCache(arg.path, result.astCache);
    return { path: result.path, viewModel: result.viewModel };
  }

  const viewModel = buildViewModel([], sourceCode);
  return { path: arg.path, viewModel };
}
