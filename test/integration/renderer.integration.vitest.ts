import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('router', () => {
  beforeEach(async () => {
    window.location.hash = '';
    const { initRouter } = await import('../../src/renderer/router');
    initRouter();
  });

  afterEach(async () => {
    const { destroyRouter } = await import('../../src/renderer/router');
    destroyRouter();
    window.location.hash = '';
  });

  it('resolves root route', async () => {
    const { getCurrentRoute } = await import('../../src/renderer/router');
    expect(getCurrentRoute()).toBe('/');
  });

  it('navigates to file route', async () => {
    const { navigate, getCurrentRoute } = await import('../../src/renderer/router');
    navigate('/file/Functions.tsx');
    expect(getCurrentRoute()).toBe('/file/Functions.tsx');
  });

  it('encodes file path in hash', async () => {
    const { navigate, getCurrentRoute } = await import('../../src/renderer/router');
    navigate('/file/My File.tsx');
    expect(getCurrentRoute()).toBe('/file/My%20File.tsx');
  });

  it('parses query parameters', async () => {
    const { navigate, getCurrentParams } = await import('../../src/renderer/router');
    navigate('/file/Functions.tsx', { sourceLine: 10, transLine: 5, var: 'test' });
    const params = getCurrentParams();
    expect(params.sourceLine).toBe(10);
    expect(params.transLine).toBe(5);
    expect(params.var).toBe('test');
  });

  it('notifies on route change', async () => {
    const { navigate, onRouteChange } = await import('../../src/renderer/router');
    const routes: string[] = [];
    onRouteChange((route) => { routes.push(route); });
    navigate('/file/Functions.tsx');
    await new Promise(r => setTimeout(r, 50));
    expect(routes).toContain('/file/Functions.tsx');
  });

  it('cleans up route listeners', async () => {
    const { navigate, onRouteChange } = await import('../../src/renderer/router');
    let count = 0;
    const unsub = onRouteChange(() => { count++; });
    unsub();
    navigate('/file/Functions.tsx');
    await new Promise(r => setTimeout(r, 50));
    expect(count).toBe(0);
  });
});

describe('debug snapshot', () => {
  beforeEach(async () => {
    window.location.hash = '';
    const { initRouter } = await import('../../src/renderer/router');
    initRouter();
  });

  afterEach(async () => {
    const { destroyRouter } = await import('../../src/renderer/router');
    destroyRouter();
  });

  it('returns route and state in snapshot', async () => {
    const { navigate } = await import('../../src/renderer/router');
    navigate('/file/Demo.tsx');
    const { snapshot } = await import('../../src/renderer/debug');
    const snap = snapshot();
    expect(snap.route).toBe('/file/Demo.tsx');
    expect(typeof snap.sidebarCollapsed).toBe('boolean');
    expect(typeof snap.timestamp).toBe('number');
    expect(snap.sidebarExpandedDirs).toBeDefined();
  });

  it('includes active fragments from DOM', async () => {
    const div = document.createElement('div');
    div.setAttribute('data-fragment-root', 'sidebar');
    document.body.appendChild(div);
    const { snapshot } = await import('../../src/renderer/debug');
    const snap = snapshot();
    expect(snap.activeFragments).toContain('sidebar');
    document.body.removeChild(div);
  });
});