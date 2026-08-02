import { buildFileData } from './src/main/translationService/buildFileData.ts';
import { renderFileTable } from './src/main/htmlRenderer/fileTableRenderer.ts';
import { readFileSync } from 'fs';
import { Window } from 'happy-dom';

const source = readFileSync('./test/fixtures/repos/irl/use-toast.ts', 'utf-8');
const { viewModel } = buildFileData(source, 'use-toast.ts');
const frag = renderFileTable({
  viewModel, fileName: 'use-toast.ts', filePath: 'use-toast.ts', sourcePct: 50,
} as any);
const html = (frag as unknown as { html: string }).html;

const window = new Window();
const document = window.document;
const container = document.createElement('div');
container.innerHTML = html;

function parseLine(lineNumber: number): { contentLeft: number; text: string } | null {
  const cells = container.querySelectorAll<HTMLElement>('[data-role="translation-cell"]');
  for (const cell of cells) {
    const style = cell.getAttribute('style') ?? '';
    const m = style.match(/grid-row:\s*(\d+)/);
    if (m && m[1].trim() === String(lineNumber)) {
      const box = cell.querySelector('[data-role="box-layer"]') as HTMLElement | null;
      let left = 0;
      let el: HTMLElement | null = box;
      while (el && el.getAttribute('data-role') === 'box-layer') {
        const ml = parseInt(el.style.marginLeft || '0', 10);
        left += ml;
        el = el.firstElementChild as HTMLElement | null;
      }
      const contentDiv = cell.querySelector('[data-role="box-content"]') as HTMLElement | null;
      if (contentDiv) {
        const pl = parseInt(contentDiv.style.paddingLeft || '0', 10);
        const pxClass = contentDiv.className.match(/px-(\d+)/)?.[1];
        const pxFromClass = pxClass ? parseInt(pxClass, 10) * 4 : 0;
        left += pl + pxFromClass;
      }
      return { contentLeft: left, text: cell.textContent ?? '' };
    }
  }
  return null;
}

function show(start: number, end: number) {
  for (let i = start; i <= end; i++) {
    const r = parseLine(i);
    const src = viewModel.lines[i - 1]?.sourceText ?? '';
    if (r) {
      console.log(`${i} [col ~${r.contentLeft}px] | ${src.trim()}`);
      const lines = r.text.split('\n');
      lines.forEach((row, idx) => {
        const leadingSpaces = (r.contentLeft / 8);  // approx chars at 8px per monospace char
        console.log(`    ${' '.repeat(Math.round(leadingSpaces))}${row}`);
      });
    }
  }
}

console.log('=== reducer switch ADD_TOAST case (71-83) ===');
show(71, 83);