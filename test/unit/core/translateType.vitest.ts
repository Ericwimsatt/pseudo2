import { describe, it, expect } from 'vitest';
import { translateType } from '../../../src/main/translationService/renderable/translateType';

describe('translateType', () => {
  describe('primitive types', () => {
    it('translates string to text', () => {
      expect(translateType('string')).toBe('text');
    });

    it('translates number to a number', () => {
      expect(translateType('number')).toBe('a number');
    });

    it('translates boolean to true or false', () => {
      expect(translateType('boolean')).toBe("'true' or 'false'");
    });

    it('translates void to nothing', () => {
      expect(translateType('void')).toBe('nothing');
    });

    it('translates never to nothing', () => {
      expect(translateType('never')).toBe('nothing');
    });

    it('translates any to anything', () => {
      expect(translateType('any')).toBe('anything');
    });

    it('translates null to null', () => {
      expect(translateType('null')).toBe('null');
    });

    it('translates undefined to undefined', () => {
      expect(translateType('undefined')).toBe('undefined');
    });

    it('translates true to true', () => {
      expect(translateType('true')).toBe('true');
    });

    it('translates false to false', () => {
      expect(translateType('false')).toBe('false');
    });
  });

  describe('array types', () => {
    it('translates string[] to a list of text', () => {
      expect(translateType('string[]')).toBe('a list of text');
    });

    it('translates Array<string> to a list of text', () => {
      expect(translateType('Array<string>')).toBe('a list of text');
    });

    it('translates ReadonlyArray<string> to a list of text', () => {
      expect(translateType('ReadonlyArray<string>')).toBe('a list of text');
    });

    it('translates nested array types', () => {
      expect(translateType('number[][]')).toBe('a list of a list of a number');
    });
  });

  describe('function types', () => {
    it('translates () => void to a function that expects nothing', () => {
      const result = translateType('() => void');
      expect(result).toContain('a function that expects');
      expect(result).toContain('returns nothing');
    });

    it('translates (x: string) => number', () => {
      const result = translateType('(x: string) => number');
      expect(result).toContain('a function that expects');
      expect(result).toContain('{');
      expect(result).toContain('}');
    });
  });

  describe('union types', () => {
    it('translates string | number to text or a number', () => {
      expect(translateType('string | number')).toBe('text or a number');
    });

    it('translates string | undefined to text (optional)', () => {
      expect(translateType('string | undefined')).toBe('text (optional)');
    });

    it('translates number | string | undefined to filtered optional', () => {
      expect(translateType('number | string | undefined')).toBe('a number or text (optional)');
    });
  });

  describe('import types', () => {
    it('strips import path from import("./types").MyType', () => {
      expect(translateType('import("./types").MyType')).toBe('MyType');
    });
  });

  describe('passthrough', () => {
    it('passes through unknown type names', () => {
      expect(translateType('CustomType')).toBe('CustomType');
    });

    it('passes through keyof T', () => {
      expect(translateType('keyof T')).toBe('keyof T');
    });
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(translateType('')).toBe('');
    });

    it('handles whitespace padding', () => {
      expect(translateType('  string  ')).toBe('text');
    });

    it('passes through quoted literal types', () => {
      expect(translateType('"hello"')).toBe('"hello"');
    });
  });
});
