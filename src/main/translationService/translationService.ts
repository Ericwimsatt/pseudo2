import { join } from 'path';
import { readFile } from 'fs/promises';
import type { ViewModel } from './renderable/types';
import { buildFileData } from './buildFileData';
import { buildViewModel } from './renderable/viewModel';
import { getRepoPath, setCache } from './cache/projectCache';

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
    setCache(arg.path, result.astCache, result.viewModel);
    return { path: result.path, viewModel: result.viewModel };
  }

  const viewModel = buildViewModel([], sourceCode, arg.path);
  return { path: arg.path, viewModel };
}
