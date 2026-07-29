import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeAttribute, escapeSourceText, escapeMetadata, escapeSnippet, escapeError } from '../../../src/main/htmlRenderer/escaping';

const AMP = String.fromCharCode(38) + 'amp;';
const LT = String.fromCharCode(38) + 'lt;';
const GT = String.fromCharCode(38) + 'gt;';
const QUOT = String.fromCharCode(38) + 'quot;';
const APOS = String.fromCharCode(38) + 'apos;';

describe('escaping', () => {
  describe('escapeHtml', () => {
    it('escapes & to &amp;', () => {
      expect(escapeHtml('a & b')).toBe('a ' + AMP + ' b');
    });

    it('escapes < to &lt;', () => {
      expect(escapeHtml('<script>')).toBe(LT + 'script' + GT);
    });

    it('escapes > to &gt;', () => {
      expect(escapeHtml('a > b')).toBe('a ' + GT + ' b');
    });

    it('escapes " to &quot;', () => {
      expect(escapeHtml('"hello"')).toBe(QUOT + 'hello' + QUOT);
    });

    it("escapes ' to &apos;", () => {
      expect(escapeHtml("'hello'")).toBe(APOS + 'hello' + APOS);
    });

    it('handles empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('handles string with no special chars', () => {
      expect(escapeHtml('hello world')).toBe('hello world');
    });

    it('escapes unicode', () => {
      expect(escapeHtml('café')).toBe('café');
    });
  });

  describe('escapeAttribute', () => {
    it('escapes all HTML special chars', () => {
      const input = 'a & b < c > d " e \' f';
      const expected = 'a ' + AMP + ' b ' + LT + ' c ' + GT + ' d ' + QUOT + ' e ' + APOS + ' f';
      expect(escapeAttribute(input)).toBe(expected);
    });

    it('is safe for HTML attributes', () => {
      const result = escapeAttribute('onclick="alert(1)"');
      expect(result).toBe('onclick=' + QUOT + 'alert(1)' + QUOT);
    });
  });

  describe('escapeSourceText', () => {
    it('escapes source code text for display', () => {
      expect(escapeSourceText('const x = "<div>"')).toBe('const x = ' + QUOT + LT + 'div' + GT + QUOT);
    });
  });

  describe('escapeMetadata', () => {
    it('escapes metadata values', () => {
      expect(escapeMetadata('value with "quotes"')).toBe('value with ' + QUOT + 'quotes' + QUOT);
    });
  });

  describe('escapeSnippet', () => {
    it('escapes snippet text', () => {
      expect(escapeSnippet('function foo()')).toBe('function foo()');
      expect(escapeSnippet('a < b')).toBe('a ' + LT + ' b');
    });
  });

  describe('escapeError', () => {
    it('escapes Error messages', () => {
      const err = new Error('Failed to load <file>');
      expect(escapeError(err)).toBe('Failed to load ' + LT + 'file' + GT);
    });

    it('escapes string errors', () => {
      expect(escapeError('Error: <unknown>')).toBe('Error: ' + LT + 'unknown' + GT);
    });

    it('handles other types', () => {
      expect(escapeError(42)).toBe('42');
      expect(escapeError(null)).toBe('null');
    });
  });
});
