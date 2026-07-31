import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { readFile } from 'fs/promises';
import { setRepoPath, clearCache } from '../../src/main/translationService/cache/projectCache';
import { buildFileData } from '../../src/main/translationService/buildFileData';
import { renderFileTable } from '../../src/main/htmlRenderer/fileTableRenderer';
import {
  renderTemplate,
  phraseOpen,
} from '../fixtures/phrasingRules';

const FIXTURE_DIR = join(import.meta.dirname, '..', 'fixtures', 'repos', 'irl');

// Derived from config/phrasing-rules.json so wording edits don't churn this
// regression test (it's about indentation/inline layout, not phrasing).
const TIMEOUT_INLINE =
  renderTemplate('variable-assignment-target', { name: 'timeout' }) +
  phraseOpen('call-function', { function: 'setTimeout' });

/**
 * Regression test for the visual staircase / misaligned indentation produced
 * when an assignment whose value starts on the SAME source line as its LHS
 * (e.g. `const timeout = setTimeout(() => {`) was rendered.
 *
 * Root cause: `renderBoxFragment` and `renderLineRow` in
 * `src/main/htmlRenderer/fileTableRenderer.ts` emitted their `<div>` wrappers
 * from multi-line template literals whose source indentation (newlines +
 * spaces around `${content}`) was preserved by the `whitespace-pre-wrap`
 * box-content div — adding several columns of leading whitespace to the
 * FIRST visual line of the cell's text while continuation lines (the
 * assignment's value) only carried the literal `\n  ` from
 * `collectStartLineSpans`. The result, on line 60 of use-toast.ts, was:
 *
 *     <lots-of-spaces>`timeout` = call setTimeout {
 *       `handler` = Function args: {} {
 *
 * i.e. the value (`handler`) appeared LESS indented than its own LHS
 * (`timeout`), which is logically inside the `call setTimeout {` block.
 *
 * The fix: keep the value inline after `= ` and emit wrappers with no
 * preserved source-indent whitespace, so the first visual line carries no
 * spurious indent and the inline child's `INDENT_UNIT` makes it one level
 * deeper than its parent — as in the source.
 */
describe('fileTableRenderer — inline assignment line indentation', () => {
  beforeEach(() => {
    clearCache();
    setRepoPath(FIXTURE_DIR);
  });

  afterEach(() => {
    clearCache();
  });

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

  async function renderFile(filePath: string): Promise<HTMLElement> {
    const source = await readFile(join(FIXTURE_DIR, filePath), 'utf-8');
    const { viewModel } = buildFileData(source, filePath);
    const frag = renderFileTable({
      viewModel,
      fileName: filePath,
      filePath,
      sourcePct: 50,
    } as any);
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.innerHTML = (frag as unknown as { html: string }).html;
    return container;
  }

  it('.value is on the same line as the LHS, and the inlined value-nested child is indented more than the LHS', async () => {
    const container = await renderFile('use-toast.ts');

    // Line 60: `  const timeout = setTimeout(() => {`
    const text = translationTextForLine(container, 60);
    expect(text).not.toBeNull();

    // Value inlined after `= ` on the same visual line as the LHS.
    expect(text).toContain(TIMEOUT_INLINE);

    // `handler` is the first argument of setTimeout, opens on line 60; it
    // must be indented AT LEAST one level deeper than `timeout`'s column.
    const lines = text!.split('\n');
    const timeoutLine = lines.find(l => l.includes('`timeout`'));
    const handlerLine = lines.find(l => l.includes('`handler`'));
    expect(timeoutLine).toBeDefined();
    expect(handlerLine).toBeDefined();

    const timeoutIndent = timeoutLine!.match(/^ */)?.[0].length ?? 0;
    const handlerIndent = handlerLine!.match(/^ */)?.[0].length ?? 0;

    expect(handlerIndent).toBeGreaterThan(timeoutIndent);
  });

  it('inline value does not first land on a deeper-indented line of its own (the old staircase)', async () => {
    const container = await renderFile('use-toast.ts');
    const text = translationTextForLine(container, 60);
    expect(text).not.toMatch(/`timeout`\s*=\s*\n\s+call setTimeout/);
  });
});