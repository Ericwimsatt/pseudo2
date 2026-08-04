interface SearchState {
  active: boolean;
  term: string;
  currentIndex: number;
  matches: HTMLElement[];
}

let searchState: SearchState = { active: false, term: '', currentIndex: -1, matches: [] };
let selectionMode: 'source' | 'translation' | 'both' = 'both';
let sourcePct = 50;

export function getSelectionMode(): string {
  return selectionMode;
}

export function getSourcePct(): number {
  return sourcePct;
}

export function getSearchState(): SearchState {
  return searchState;
}

function getFileTable(): HTMLElement | null {
  return document.querySelector('[data-role="file-table"]');
}

function getCodeGrid(): HTMLElement | null {
  return document.querySelector('[data-role="code-grid"]');
}

export function initFileView(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const modeBtn = target.closest('[data-role="selection-mode-button"]');
    if (modeBtn) {
      e.preventDefault();
      const mode = modeBtn.getAttribute('data-mode') as typeof selectionMode;
      if (mode) setSelectionMode(mode);
      return;
    }

    const prevBtn = target.closest('[data-role="search-prev"]');
    if (prevBtn) {
      e.preventDefault();
      navigateSearch(-1);
      return;
    }

    const nextBtn = target.closest('[data-role="search-next"]');
    if (nextBtn) {
      e.preventDefault();
      navigateSearch(1);
      return;
    }

    const closeBtn = target.closest('[data-role="search-close"]');
    if (closeBtn) {
      e.preventDefault();
      closeSearch();
      return;
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
      e.preventDefault();
      openSearch();
      return;
    }

    if (e.key === 'Escape' && searchState.active) {
      closeSearch();
      e.preventDefault();
      return;
    }

    if (searchState.active && (e.key === 'Enter')) {
      e.preventDefault();
      navigateSearch(e.shiftKey ? -1 : 1);
      return;
    }

    if (e.key === 's' && !isInputFocused()) {
      setSelectionMode('source');
      return;
    }
    if (e.key === 't' && !isInputFocused()) {
      setSelectionMode('translation');
      return;
    }
    if (e.key === 'b' && !isInputFocused()) {
      setSelectionMode('both');
      return;
    }
  });

  document.addEventListener('input', (e) => {
    const input = e.target as HTMLElement;
    if (input.getAttribute('data-role') === 'search-input') {
      const term = (input as HTMLInputElement).value;
      performSearch(term);
    }
  });

  initResizeHandle();
  applyDeepLinks();
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
}

function setSelectionMode(mode: 'source' | 'translation' | 'both'): void {
  selectionMode = mode;
  const ft = getFileTable();
  if (!ft) return;

  ft.querySelectorAll('[data-role="selection-mode-button"]').forEach(btn => {
    const btnMode = btn.getAttribute('data-mode');
    btn.setAttribute('aria-pressed', String(btnMode === mode));
    btn.classList.toggle('bg-blue-100', btnMode === mode);
    btn.classList.toggle('border-blue-300', btnMode === mode);
    btn.classList.toggle('text-blue-700', btnMode === mode);
    btn.classList.toggle('bg-white', btnMode !== mode);
    btn.classList.toggle('border-gray-300', btnMode !== mode);
    btn.classList.toggle('text-gray-500', btnMode !== mode);
  });

  ft.querySelectorAll('[data-role="source-cell"]').forEach(cell => {
    cell.classList.toggle('select-none', mode === 'translation');
  });
  ft.querySelectorAll('[data-role="translation-cell"]').forEach(cell => {
    cell.classList.toggle('select-none', mode === 'source');
  });
}

function initResizeHandle(): void {
  const grid = getCodeGrid();
  if (!grid) return;

  let isResizing = false;
  let startX = 0;
  let startPct = sourcePct;

  const onPointerDown = (e: PointerEvent) => {
    const handle = (e.target as HTMLElement).closest('[data-role="resize-handle"]');
    if (!handle) return;

    e.preventDefault();
    isResizing = true;
    startX = e.clientX;
    startPct = sourcePct;

    const ft = getFileTable();
    if (ft) {
      ft.style.cursor = 'col-resize';
    }
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isResizing) return;

    const gridRect = grid.getBoundingClientRect();
    const gridWidth = gridRect.width;
    const dx = e.clientX - startX;
    const deltaPct = (dx / gridWidth) * 100;
    const newPct = Math.max(20, Math.min(80, startPct + deltaPct));
    sourcePct = Math.round(newPct);

    grid.style.gridTemplateColumns = `6px 48px ${sourcePct}% 4px 20px 1fr`;
    grid.setAttribute('data-source-pct', String(sourcePct));
  };

  const onPointerUp = () => {
    isResizing = false;
    const ft = getFileTable();
    if (ft) ft.style.cursor = '';
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  };

  grid.addEventListener('pointerdown', onPointerDown);
}

function openSearch(): void {
  const controls = document.querySelector('[data-role="search-controls"]');
  if (!controls) return;

  controls.classList.remove('hidden');
  const input = controls.querySelector('[data-role="search-input"]') as HTMLInputElement;
  if (input) {
    input.value = searchState.term;
    input.focus();
    input.select();
  }
  searchState.active = true;
}

function closeSearch(): void {
  if (!searchState.active) return;
  searchState.active = false;
  searchState.term = '';
  searchState.currentIndex = -1;
  searchState.matches = [];

  const controls = document.querySelector('[data-role="search-controls"]');
  if (controls) {
    controls.classList.add('hidden');
    const input = controls.querySelector('[data-role="search-input"]') as HTMLInputElement;
    if (input) input.value = '';
  }

  const stats = document.querySelector('[data-role="search-stats"]');
  if (stats) stats.textContent = '';

  const prevBtn = document.querySelector('[data-role="search-prev"]') as HTMLButtonElement;
  const nextBtn = document.querySelector('[data-role="search-next"]') as HTMLButtonElement;
  if (prevBtn) { prevBtn.disabled = true; prevBtn.classList.add('opacity-30'); }
  if (nextBtn) { nextBtn.disabled = true; nextBtn.classList.add('opacity-30'); }

  clearSearchHighlights();
}

function clearSearchHighlights(): void {
  const grid = getCodeGrid();
  if (!grid) return;

  grid.querySelectorAll('mark').forEach(mark => {
    const parent = mark.parentNode;
    if (parent) {
      const text = document.createTextNode(mark.textContent || '');
      parent.replaceChild(text, mark);
    }
  });
}

function performSearch(term: string): void {
  searchState.term = term;
  searchState.currentIndex = -1;
  searchState.matches = [];

  const grid = getCodeGrid();
  if (!grid) return;

  clearSearchHighlights();

  if (!term) {
    updateSearchStats();
    return;
  }

  const termLower = term.toLowerCase();
  const allCells = grid.querySelectorAll('[data-role="source-cell"] [data-role="box-content"], [data-role="translation-cell"] [data-role="box-content"]');

  allCells.forEach(cell => {
    const text = cell.textContent || '';
    if (text.toLowerCase().includes(termLower)) {
      const row = cell.closest('[data-role="box-content"]');
      if (row) searchState.matches.push(row as HTMLElement);
    }
  });

  if (grid.querySelector('[data-role="source-cell"]')) {
    grid.querySelectorAll('[data-role="source-cell"]').forEach(cell => {
      const text = cell.textContent || '';
      if (text.toLowerCase().includes(termLower)) {
        searchState.matches.push(cell as HTMLElement);
      }
    });
  }

  updateSearchStats();
  updatePrevNextButtons();

  if (searchState.matches.length > 0) {
    scrollToMatch(0);
  }
}

function updateSearchStats(): void {
  const stats = document.querySelector('[data-role="search-stats"]');
  if (!stats) return;
  const total = searchState.matches.length;
  stats.textContent = total > 0
    ? `${searchState.currentIndex + 1} / ${total}`
    : searchState.term ? 'No results' : '';
}

function updatePrevNextButtons(): void {
  const prevBtn = document.querySelector('[data-role="search-prev"]') as HTMLButtonElement;
  const nextBtn = document.querySelector('[data-role="search-next"]') as HTMLButtonElement;
  const hasMatches = searchState.matches.length > 0;

  if (prevBtn) {
    prevBtn.disabled = !hasMatches;
    prevBtn.classList.toggle('opacity-30', !hasMatches);
  }
  if (nextBtn) {
    nextBtn.disabled = !hasMatches;
    nextBtn.classList.toggle('opacity-30', !hasMatches);
  }
}

function navigateSearch(direction: 1 | -1): void {
  if (searchState.matches.length === 0) return;

  let newIndex = searchState.currentIndex + direction;
  if (newIndex < 0) newIndex = searchState.matches.length - 1;
  if (newIndex >= searchState.matches.length) newIndex = 0;

  scrollToMatch(newIndex);
}

function scrollToMatch(index: number): void {
  const match = searchState.matches[index];
  if (!match) return;

  searchState.currentIndex = index;

  const grid = getCodeGrid();
  if (grid) {
    grid.querySelectorAll('.search-active-match').forEach(el => el.classList.remove('search-active-match'));
    const matchRow = match.closest('[data-role="box-content"], [data-role="source-cell"]');
    if (matchRow) {
      matchRow.classList.add('search-active-match');
      matchRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  updateSearchStats();
}

function applyDeepLinks(): void {
  const grid = getCodeGrid();
  if (!grid) return;

  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');

  const sl = params.get('sourceLine');
  const tl = params.get('transLine');
  const v = params.get('var');

  if (sl || tl || v) {
    setTimeout(() => {
      let targetRow: HTMLElement | null = null;

      if (v) {
        const term = v;
        const cell = grid.querySelector(`[data-search-context*='${term.replace(/'/g, "\\'")}']`);
        if (cell) {
          targetRow = cell.closest('[data-role="box-content"]') as HTMLElement;
        }
        if (!targetRow) {
          const allCells = grid.querySelectorAll('[data-role="source-cell"]');
          for (const c of allCells) {
            if ((c.textContent || '').includes(term)) {
              targetRow = c as HTMLElement;
              break;
            }
          }
        }
      }

      if (!targetRow && sl) {
        targetRow = grid.querySelector(`[data-role="source-cell"][data-line="${sl}"]`) as HTMLElement;
      }

      if (!targetRow && tl) {
        targetRow = grid.querySelector(`[data-role="translation-cell"]:nth-of-type(${tl})`) as HTMLElement;
      }

      if (targetRow) {
        targetRow.scrollIntoView({ block: 'center' });
      }
    }, 100);
  }
}

export function afterFileSwap(): void {
  const ft = getFileTable();
  if (ft) {
    const pct = ft.getAttribute('data-source-pct');
    if (pct) sourcePct = Number(pct);
    const grid = getCodeGrid();
    if (grid && pct) {
      grid.style.gridTemplateColumns = `6px 48px ${pct}% 4px 20px 1fr`;
    }
  }

  searchState = { active: false, term: '', currentIndex: -1, matches: [] };

  applyDeepLinks();
}
