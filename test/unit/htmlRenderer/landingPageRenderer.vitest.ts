import { describe, it, expect } from 'vitest';
import { renderLandingPage } from '../../../src/main/htmlRenderer/landingPageRenderer';

const LT = String.fromCharCode(38) + 'lt;';
const GT = String.fromCharCode(38) + 'gt;';

describe('landingPageRenderer', () => {
  it('renders landing page with default state', () => {
    const result = renderLandingPage({ loading: false, loadError: null });

    expect(result.html).toContain('data-role="landing-page"');
    expect(result.html).toContain('data-testid="landing-page"');
    expect(result.html).toContain('Load Repository');
    expect(result.html).toContain('data-role="browse-button"');
    expect(result.html).toContain('data-testid="browse-button"');
    expect(result.html).toContain('data-role="drop-zone"');
    expect(result.html).toContain('data-testid="drop-zone"');
  });

  it('shows browse button and drop zone', () => {
    const result = renderLandingPage({ loading: false, loadError: null });

    expect(result.html).toContain('Browse for a folder...');
    expect(result.html).toContain('Drop a folder here');
  });

  it('shows loading state when loading', () => {
    const result = renderLandingPage({ loading: true, loadError: null });

    expect(result.html).toContain('Processing folder...');
    expect(result.html).toContain('border-blue-500');
    expect(result.html).toContain('bg-blue-50');
  });

  it('shows error when loadError is provided', () => {
    const result = renderLandingPage({ loading: false, loadError: 'Permission denied' });

    expect(result.html).toContain('data-role="load-error"');
    expect(result.html).toContain('data-testid="load-error"');
    expect(result.html).toContain('Permission denied');
    expect(result.html).toContain('bg-red-100');
  });

  it('escapes HTML in loadError', () => {
    const result = renderLandingPage({ loading: false, loadError: '<script>alert(1)</script>' });

    expect(result.html).toContain(LT + 'script' + GT);
    expect(result.html).not.toContain('<script>');
  });

  it('does not show error when loadError is null', () => {
    const result = renderLandingPage({ loading: false, loadError: null });

    expect(result.html).not.toContain('data-role="load-error"');
  });

  it('includes folder browser modal placeholder', () => {
    const result = renderLandingPage({ loading: false, loadError: null });

    expect(result.html).toContain('data-role="folder-browser-modal"');
    expect(result.html).toContain('data-testid="folder-browser-modal"');
    expect(result.html).toContain('Select Folder');
  });

  it('includes metadata', () => {
    const result = renderLandingPage({ loading: false, loadError: null });

    expect(result.metadata.kind).toBe('landing-page');
    expect(result.metadata.timestamp).toBeTypeOf('number');
  });

  it('shows drag and drop text', () => {
    const result = renderLandingPage({ loading: false, loadError: null });

    expect(result.html).toContain('drag & drop');
  });
});
