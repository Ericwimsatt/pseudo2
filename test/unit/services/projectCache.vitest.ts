import { describe, it, expect, beforeEach } from 'vitest';
import { setCache, getCache, clearCache, getRepoPath, setRepoPath } from '../../../src/main/translationService/cache/projectCache';
import type { ViewModel } from '../../../src/main/translationService/renderable/types';
import type { AstCache } from '../../../src/main/translationService/cache/astCache';

const makeAstCache = () => ({}) as unknown as AstCache;
const makeViewModel = () => ({ lines: [] }) as ViewModel;

describe('projectCache', () => {
  beforeEach(() => {
    clearCache();
    setRepoPath('');
  });

  it('stores and retrieves a cache entry', () => {
    const astCache = makeAstCache();
    const viewModel = makeViewModel();
    setCache('test.ts', astCache, viewModel);
    const entry = getCache('test.ts');
    expect(entry).toBeDefined();
    expect(entry!.astCache).toBe(astCache);
    expect(entry!.viewModel).toBe(viewModel);
  });

  it('returns undefined for non-existent path', () => {
    expect(getCache('nonexistent.ts')).toBeUndefined();
  });

  it('stores multiple files independently', () => {
    const ac1 = makeAstCache();
    const vm1 = makeViewModel();
    const ac2 = makeAstCache();
    const vm2 = makeViewModel();
    setCache('a.ts', ac1, vm1);
    setCache('b.ts', ac2, vm2);
    expect(getCache('a.ts')!.astCache).toBe(ac1);
    expect(getCache('b.ts')!.astCache).toBe(ac2);
  });

  it('overwrites existing cache entry', () => {
    const ac1 = makeAstCache();
    const vm1 = makeViewModel();
    setCache('test.ts', ac1, vm1);
    const ac2 = makeAstCache();
    const vm2 = makeViewModel();
    setCache('test.ts', ac2, vm2);
    expect(getCache('test.ts')!.astCache).toBe(ac2);
  });

  it('clears all entries', () => {
    setCache('test.ts', makeAstCache(), makeViewModel());
    clearCache();
    expect(getCache('test.ts')).toBeUndefined();
  });

  it('stores and retrieves repo path', () => {
    expect(getRepoPath()).toBe('');
    setRepoPath('/some/path');
    expect(getRepoPath()).toBe('/some/path');
  });
});
