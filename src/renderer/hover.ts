import { loadFragment } from './ipcAdapter';

interface HoverState {
  trigger: HTMLElement | null;
  refPos?: number;
  filePath?: string;
  identifier?: string;
  kind?: 'module';
}

let hoverState: HoverState = { trigger: null };
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let popupEl: HTMLElement | null = null;

export function getHoverState(): HoverState {
  return hoverState;
}

export function initHover(): void {
  document.addEventListener('mouseover', (e) => {
    const span = (e.target as HTMLElement).closest('[data-refpos]') as HTMLElement | null;
    if (!span) return;

    const fileTable = span.closest('[data-role="file-table"]');
    if (!fileTable) return;

    const refPosStr = span.getAttribute('data-refpos');
    const refPos = refPosStr ? parseInt(refPosStr, 10) : undefined;
    const filePath = fileTable.getAttribute('data-file-path') || '';

    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }

    const identifier = span.getAttribute('data-hover-identifier') || undefined;
    const kind = span.getAttribute('data-hover-kind') === 'module' ? 'module' : undefined;
    const currentId = `${filePath}:${refPos}:${identifier ?? ''}:${kind ?? ''}`;
    const prevId = hoverState.filePath && hoverState.refPos !== undefined
      ? `${hoverState.filePath}:${hoverState.refPos}:${hoverState.identifier ?? ''}:${hoverState.kind ?? ''}`
      : null;

    if (currentId === prevId) return;

    hoverState = { trigger: span as HTMLElement, refPos, filePath, identifier, kind };
    showTooltip(span as HTMLElement);
  });

  document.addEventListener('mouseout', (e) => {
    const related = e.relatedTarget as HTMLElement | null;
    if (!hoverState.trigger) return;

    if (popupEl && (popupEl.contains(related) || popupEl === related)) return;
    if (hoverState.trigger.contains(related)) return;

    scheduleHide();
  });
}

function scheduleHide(): void {
  if (hideTimeout) clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => {
    hideTooltip();
  }, 80);
}

function showTooltip(trigger: HTMLElement): void {
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  const refPos = hoverState.refPos;
  const filePath = hoverState.filePath;
  if (refPos === undefined || !filePath) return;

  let container = document.querySelector('[data-role="tooltip-container"]') as HTMLElement;
  if (!container) {
    const ft = document.querySelector('[data-role="file-table"]');
    if (!ft) return;
    container = document.createElement('div');
    container.setAttribute('data-role', 'tooltip-container');
    ft.appendChild(container);
  }

  configureTooltipContainer(container);
  container.classList.remove('hidden');
  popupEl = container;
  trigger.setAttribute('aria-describedby', 'pseudo-tooltip');

  loadFragment({
    method: 'getTooltipFragment',
    args: {
      filePath,
      query: {
        refPos,
        ...(hoverState.identifier ? { identifier: hoverState.identifier } : {}),
        ...(hoverState.kind ? { kind: hoverState.kind } : {}),
      },
    },
    target: container,
    swapStyle: 'innerHTML',
    onError: () => {
      container.innerHTML = '<div class="p-2 text-red-500 text-sm">Failed to load</div>';
    },
    onSuccess: () => positionTooltip(trigger, container),
  });

  positionTooltip(trigger, container);
}

function positionTooltip(trigger: HTMLElement, tooltip: HTMLElement): void {
  const triggerRect = trigger.getBoundingClientRect();
  requestAnimationFrame(() => {
    const tipRect = tooltip.getBoundingClientRect();
    let top = triggerRect.bottom + 4;
    let left = triggerRect.left;

    if (top + tipRect.height > window.innerHeight) {
      top = triggerRect.top - tipRect.height - 4;
    }
    if (left + tipRect.width > window.innerWidth) {
      left = window.innerWidth - tipRect.width - 8;
    }
    if (left < 4) left = 4;
    if (top < 4) top = 4;

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  });
}

function hideTooltip(): void {
  const container = document.querySelector('[data-role="tooltip-container"]');
  if (container) {
    container.classList.add('hidden');
  }
  hoverState.trigger?.removeAttribute('aria-describedby');
  hoverState = { trigger: null };
  hideTimeout = null;
  popupEl = null;
}

function configureTooltipContainer(container: HTMLElement): void {
  container.id = 'pseudo-tooltip';
  container.setAttribute('role', 'tooltip');
  container.classList.add(
    'fixed',
    'z-50',
    'max-w-md',
    'max-h-80',
    'overflow-y-auto',
    'bg-white',
    'border',
    'border-gray-300',
    'rounded-lg',
    'shadow-lg',
    'p-3',
    'text-sm',
  );
  container.style.position = 'fixed';
  container.style.pointerEvents = 'auto';
}

export function afterFileSwapHover(): void {
  if (hideTimeout) clearTimeout(hideTimeout);
  hideTimeout = null;
  hoverState = { trigger: null };
  popupEl = null;

  const ft = document.querySelector('[data-role="file-table"]');
  if (!ft) return;
  let container = ft.querySelector('[data-role="tooltip-container"]') as HTMLElement;
  if (!container) {
    container = document.createElement('div');
    container.setAttribute('data-role', 'tooltip-container');
    ft.appendChild(container);
  }
  configureTooltipContainer(container);
  container.classList.add('hidden');
}
