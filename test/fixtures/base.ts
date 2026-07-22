/* oxlint-disable react-hooks/rules-of-hooks */
import { test as base, type Page } from '@playwright/test';
import { loadFixtureRepo, type FixtureData, type FixtureFileEntry } from './loadFixture';

export { loadFixtureRepo };
export type { FixtureData, FixtureFileEntry };

type FixtureRepo = FixtureData;

export const test = base.extend<{ fixtureRepo: FixtureRepo }>({
  fixtureRepo: async (_context, use) => {
    const fixture = await loadFixtureRepo('language-features');
    await use(fixture);
  },
});

export function createTestForRepo(repoName: string) {
  return base.extend<{ fixtureRepo: FixtureRepo }>({
    fixtureRepo: async (_context, use) => {
      const fixture = await loadFixtureRepo(repoName);
      await use(fixture);
    },
  });
}

export async function injectFixture(
  page: Page,
  fixture: FixtureData,
  targetFile?: string,
) {
  const singleFile = targetFile
    ? (() => {
        const entry = fixture.files.get(targetFile);
        if (!entry) throw new Error(`File "${targetFile}" not found in fixture`);
        return { path: targetFile, entry };
      })()
    : undefined;

  const viewModel = singleFile?.entry.viewModel ?? fixture.files.values().next().value!.viewModel;
  const filePath = singleFile?.path ?? [...fixture.files.keys()][0];
  const sourceLines = singleFile?.entry.sourceLines ?? [...fixture.files.values()][0]!.sourceLines;

  await page.addInitScript((data) => {
    const tree = data.fixtureTree;
    (window as any).electronAPI = {
      loadProject: async ({ path: _p }: { path: string }) => ({ tree, path: data.repoPath }),
      getTree: async () => ({ tree }),
      loadFileSource: async ({ path: _p }: { path: string }) => ({ path: data.filePath, lines: data.sourceLines }),
      loadFileTranslation: async ({ path: _p }: { path: string }) => ({ viewModel: data.viewModel, path: data.filePath }),
      getNodeDetail: async () => ({ sections: [] }),
      browseDirectory: async ({ requestedPath: _p }: { requestedPath?: string }) => ({
        currentPath: data.repoPath,
        parentPath: null,
        directories: [],
      }),
      uploadFolder: async ({ files: _f }: { files: any[] }) => ({ tree, path: data.repoPath }),
      openDirectorySelector: async () => null,
      getLastProjectPath: async () => data.repoPath,
      setLastProjectPath: async (_path: string) => {},
      clearLastProjectPath: async () => {},
      onMenuLoadFolder: () => () => {},
    };
  }, {
    repoPath: fixture.repoPath,
    fixtureTree: fixture.tree,
    viewModel,
    filePath,
    sourceLines,
  });
}
