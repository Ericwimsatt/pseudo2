import { describe, it, expect } from 'vitest';
import { renderLoading, renderError, renderFilePlaceholder } from '../../../src/main/htmlRenderer/stateRenderers';

const LT = String.fromCharCode(38) + 'lt;';
const GT = String.fromCharCode(38) + 'gt;';

describe('stateRenderers', () => {
  describe('renderLoading', () => {
    it('renders loading state with default message', () => {
      const result = renderLoading({ message: 'Loading...' });

      expect(result.html).toContain('data-role="loading"');
      expect(result.html).toContain('data-testid="loading"');
      expect(result.html).toContain('Loading...');
    });

    it('renders loading state with custom message', () => {
      const result = renderLoading({ message: 'Fetching data...' });

      expect(result.html).toContain('Fetching data...');
    });

    it('escapes HTML in loading message', () => {
      const result = renderLoading({ message: '<script>alert(1)</script>' });

      expect(result.html).toContain(LT + 'script' + GT);
      expect(result.html).not.toContain('<script>');
    });

    it('includes metadata', () => {
      const result = renderLoading({ message: 'Loading...' });

      expect(result.metadata.kind).toBe('loading');
      expect(result.metadata.timestamp).toBeTypeOf('number');
    });
  });

  describe('renderError', () => {
    it('renders error state with message', () => {
      const result = renderError({ message: 'Something went wrong' });

      expect(result.html).toContain('data-role="error"');
      expect(result.html).toContain('data-testid="error"');
      expect(result.html).toContain('Error: Something went wrong');
    });

    it('escapes HTML in error message', () => {
      const result = renderError({ message: '<img src=x onerror=alert(1)>' });

      expect(result.html).toContain(LT + 'img');
      expect(result.html).not.toContain('<img');
    });

    it('includes metadata', () => {
      const result = renderError({ message: 'Failed' });

      expect(result.metadata.kind).toBe('error');
      expect(result.metadata.timestamp).toBeTypeOf('number');
    });
  });

  describe('renderFilePlaceholder', () => {
    it('renders placeholder with message', () => {
      const result = renderFilePlaceholder({ message: 'No file selected' });

      expect(result.html).toContain('data-role="file-placeholder"');
      expect(result.html).toContain('data-testid="file-placeholder"');
      expect(result.html).toContain('No file selected');
    });

    it('escapes HTML in placeholder message', () => {
      const result = renderFilePlaceholder({ message: '<b>bold</b>' });

      expect(result.html).toContain(LT + 'b' + GT);
      expect(result.html).not.toContain('<b>');
    });

    it('includes metadata', () => {
      const result = renderFilePlaceholder({ message: 'Select a file' });

      expect(result.metadata.kind).toBe('error');
      expect(result.metadata.timestamp).toBeTypeOf('number');
    });
  });
});
