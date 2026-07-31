type RouteListener = (route: string, params: RouteParams) => void;

export interface RouteParams {
  sourceLine?: number;
  transLine?: number;
  var?: string;
}

function parseHash(): string {
  const hash = window.location.hash.slice(1);
  const path = hash.includes('?') ? hash.slice(0, hash.indexOf('?')) : hash;
  return path || '/';
}

function parseQueryString(): RouteParams {
  const hash = window.location.hash.slice(1);
  const qIndex = hash.indexOf('?');
  if (qIndex === -1) return {};
  const params: RouteParams = {};
  const search = new URLSearchParams(hash.slice(qIndex + 1));
  const sl = search.get('sourceLine');
  const tl = search.get('transLine');
  const v = search.get('var');
  if (sl) params.sourceLine = Number(sl);
  if (tl) params.transLine = Number(tl);
  if (v) params.var = v;
  return params;
}

let currentListeners: RouteListener[] = [];

export function onRouteChange(listener: RouteListener): () => void {
  currentListeners.push(listener);
  return () => {
    currentListeners = currentListeners.filter(l => l !== listener);
  };
}

function notify() {
  const route = parseHash();
  const params = parseQueryString();
  for (const listener of currentListeners) {
    listener(route, params);
  }
}

export function navigate(path: string, params?: RouteParams): void {
  let hash = `#${path}`;
  if (params) {
    const search = new URLSearchParams();
    if (params.sourceLine) search.set('sourceLine', String(params.sourceLine));
    if (params.transLine) search.set('transLine', String(params.transLine));
    if (params.var) search.set('var', params.var);
    const qs = search.toString();
    if (qs) hash += `?${qs}`;
  }

  if (window.location.hash !== hash) {
    window.location.hash = hash;
  } else {
    notify();
  }
}

export function getCurrentRoute(): string {
  return parseHash();
}

export function getCurrentParams(): RouteParams {
  return parseQueryString();
}

export function initRouter(): void {
  window.addEventListener('hashchange', notify);

  const hash = window.location.hash;
  if (!hash || hash === '#/') {
    window.location.hash = '#/';
  }

  setTimeout(notify, 0);
}

export function destroyRouter(): void {
  window.removeEventListener('hashchange', notify);
  currentListeners = [];
}