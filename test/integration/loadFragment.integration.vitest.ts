import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { setRepoPath, clearCache } from '../../src/main/translationService/cache/projectCache';
import { buildFileData } from '../../src/main/translationService/buildFileData';
import { renderFileTable } from '../../src/main/htmlRenderer/fileTableRenderer';
import { renderFileFragment } from '../../src/main/fragmentService';
import { loadFragment } from '../../src/renderer/ipcAdapter';

const FIXTURE_DIR = join(import.meta.dirname, '..', 'fixtures', 'repos', 'irl');
const FIXTURE_FILE = 'use-toast.ts';

// Boot the preload-like bridge with a real getFileFragment backing store.
// Other methods are not exercised here and are left as no-op stubs.
function stubElectronAPI(): void {
  (window as unknown as Record<string, unknown>).electronAPI = {
    getFileFragment: async (arg: { filePath: string }) =>
      renderFileFragment(arg.filePath),
  };
}

/**
 * Integration test for the renderer-side `loadFragment` IPC adapter.
 *
 * Goal: prove the HTML produced by the main-process file renderer for a real
 * fixture file (irl/use-toast.ts) survives the IPC boundary and is swapped
 * into the DOM intact, with the file's key symbols visible to the renderer.
 *
 * The `electronAPI.getFileFragment` bridge is stubbed with the *real* service
 * output (same `renderFileFragment` the IPC handler delegates to), so this is
 * the bytes the renderer would actually receive for this file.
 */
describe('loadFragment — irl/use-toast.ts', () => {
  beforeEach(() => {
    clearCache();
    setRepoPath(FIXTURE_DIR);

    // happy-dom: start from a clean document each test.
    document.body.innerHTML = '';
  });

  afterEach(() => {
    clearCache();
    delete (window as unknown as Record<string, unknown>).electronAPI;
  });

  it('swaps the real file-table fragment into the target container', async () => {
    stubElectronAPI();

    const container = document.createElement('div');
    container.id = 'file-view';
    document.body.appendChild(container);

    const result = await loadFragment({
      method: 'getFileFragment',
      args: { filePath: FIXTURE_FILE },
      target: '#file-view',
    });

    expect(result).not.toBeNull();
    expect(result?.metadata.kind).toBe('file-table');
    expect(result?.metadata.filePath).toBe(FIXTURE_FILE);
    expect(container.querySelector('[data-role="file-table"]')).not.toBeNull();
    expect(container.querySelector('[data-role="code-grid"]')).not.toBeNull();
  });

  it('renders the key exported symbols from use-toast.ts', async () => {
    stubElectronAPI();

    const container = document.createElement('div');
    container.id = 'file-view';
    document.body.appendChild(container);

    await loadFragment({
      method: 'getFileFragment',
      args: { filePath: FIXTURE_FILE },
      target: '#file-view',
    });

    // The file-table renderer escapes source text; assert on the escaped forms
    // so the test is robust against the renderer's escaping behavior.
    const text = container.textContent ?? '';
    expect(text).toContain('reducer');
    expect(text).toContain('useToast');
    expect(text).toContain('toast');
    expect(text).toContain('genId');
  });

  it('matches the canonical renderer output for the same input', async () => {
    stubElectronAPI();

    const sourceCode = await readFile(join(FIXTURE_DIR, FIXTURE_FILE), 'utf-8');
    const { viewModel } = buildFileData(sourceCode, FIXTURE_FILE);
    const direct = renderFileTable({
      viewModel,
      fileName: FIXTURE_FILE,
      filePath: FIXTURE_FILE,
    });

    const container = document.createElement('div');
    container.id = 'file-view';
    document.body.appendChild(container);

    const acrossIpc = await loadFragment({
      method: 'getFileFragment',
      args: { filePath: FIXTURE_FILE },
      target: '#file-view',
    });

    expect(acrossIpc?.html).toBe(direct.html);
    expect(acrossIpc?.metadata.kind).toBe(direct.metadata.kind);
  });

  it('shows a loading indicator before the fragment resolves', async () => {
    // Delay the IPC response long enough to observe the loading placeholder.
    (window as unknown as Record<string, unknown>).electronAPI = {
      getFileFragment: () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(renderFileFragment(FIXTURE_FILE)), 10),
        ),
    };

    const container = document.createElement('div');
    container.id = 'file-view';
    document.body.appendChild(container);

    const pending = loadFragment({
      method: 'getFileFragment',
      args: { filePath: FIXTURE_FILE },
      target: '#file-view',
    });

    expect(container.querySelector('[data-role="loading"]')).not.toBeNull();

    await pending;

    expect(container.querySelector('[data-role="loading"]')).toBeNull();
    expect(container.querySelector('[data-role="file-table"]')).not.toBeNull();
  });
});

/**
 * Regression test for translation-cell subtree duplication.
 *
 * Symptom: when a translated node spans multiple source lines (e.g. a function
 * body, a switch, a case block), the translation cell on every line that
 * *starts* such a node reprints the node's entire subtree. The result is that
 * later sibling branches appear multiple times across rows — most visibly, the
 * DISMISS_TOAST / REMOVE_TOAST cases of `reducer` showed up on the rows for
 * `export const reducer`, `switch`, `case ADD_TOAST`, `case UPDATE_TOAST`,
 * etc., instead of only on their own row.
 *
 * Desired behavior: a line's translation cell renders only the portion of the
 * translation that *originates* on that line. Anything that starts on a later
 * source line should be left for that later line's row to render.
 */
describe('loadFragment — no translation-cell duplication across rows', () => {
  beforeEach(() => {
    clearCache();
    setRepoPath(FIXTURE_DIR);
    stubElectronAPI();
  });

  afterEach(() => {
    clearCache();
    delete (window as unknown as Record<string, unknown>).electronAPI;
  });

  async function loadIntoContainer(): Promise<HTMLElement> {
    document.body.innerHTML = '';
    const container = document.createElement('div');
    container.id = 'file-view';
    document.body.appendChild(container);
    const result = await loadFragment({
      method: 'getFileFragment',
      args: { filePath: FIXTURE_FILE },
      target: '#file-view',
    });
    // Surface silent swap failures when debugging.
    if (result === null) {
      throw new Error(`loadFragment returned null; container.innerHTML.length=${container.innerHTML.length}`);
    }
    return container;
  }

  /** Returns the translation-cell text for a given source line number, or null. */
  function translationTextForLine(container: HTMLElement, lineNumber: number): string | null {
    const cells = container.querySelectorAll<HTMLElement>('[data-role="translation-cell"]');
    for (const cell of cells) {
      const style = cell.getAttribute('style') ?? '';
      const m = style.match(/grid-row:\s*(\d+)/);
      if (m && m[1].trim() === String(lineNumber)) {
        return cell.textContent ?? null;
      }
    }
    return null;
  }

  it('reducer export row does not replay later sibling case branches', async () => {
    const container = await loadIntoContainer();

    // Line 71: `export const reducer = (state, action): State => {`
    // Its translation should be the function header only — not the entire
    // switch body containing every case branch.
    const text = translationTextForLine(container, 71);
    expect(text).not.toBeNull();
    expect(text).toContain('reducer');
    // Every case label below lives on its own source line and must not be
    // re-emitted on the reducer row.
    expect(text).not.toContain('ADD_TOAST');
    expect(text).not.toContain('UPDATE_TOAST');
    expect(text).not.toContain('DISMISS_TOAST');
    expect(text).not.toContain('REMOVE_TOAST');
  });

  it('switch row does not replay later case branches', async () => {
    const container = await loadIntoContainer();

    // Line 72: `switch (action.type) {`
    const text = translationTextForLine(container, 72);
    expect(text).not.toBeNull();
    expect(text).toContain('action.type');
    expect(text).not.toContain('UPDATE_TOAST');
    expect(text).not.toContain('DISMISS_TOAST');
    expect(text).not.toContain('REMOVE_TOAST');
  });

  it('translated case→branch phrase appears on at most one row', async () => {
    const container = await loadIntoContainer();
    const cells = container.querySelectorAll<HTMLElement>('[data-role="translation-cell"]');

    // The translator emits exactly this phrasing for each `case "X":` →
    // `If action.type === "X" {`. The bug under investigation re-emits the
    // entire switch subtree (and thus every case→branch translation) onto
    // every parent construct's row, causing it to appear multiple times.
    // Counting how many rows contain each branch phrase is a direct probe for
    // the duplication.
    const phrases = {
      'action.type === "ADD_TOAST"': 0,
      'action.type === "UPDATE_TOAST"': 0,
      'action.type === "DISMISS_TOAST"': 0,
      'action.type === "REMOVE_TOAST"': 0,
    };
    for (const cell of cells) {
      const text = cell.textContent ?? '';
      for (const phrase of Object.keys(phrases)) {
        if (text.includes(phrase)) phrases[phrase as keyof typeof phrases]++;
      }
    }

    // Each case→branch translation must show up on at most one row — the row
    // for the source line where the case label lives (or its deduplicated
    // successor row, depending on the renderer's choice). Anything more is
    // upstream duplication.
    for (const [, count] of Object.entries(phrases)) {
      expect(count).toBeLessThanOrEqual(1);
    }
  });
});