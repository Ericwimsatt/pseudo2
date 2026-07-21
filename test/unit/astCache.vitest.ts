import { describe, it, expect, beforeEach } from 'vitest';
import { Project, Node, SourceFile } from 'ts-morph';
import { AstCache } from '../../src/main/translationService/cache/astCache';

const SOURCE = [
  'function greet(name: string): string {',
  '  return "Hello, " + name;',
  '}',
  '',
  'let count = 0;',
  'count = count + 1;',
  'const msg = greet("World");',
  'console.log(msg);',
].join('\n');

let project: Project;
let sourceFile: SourceFile;
let cache: AstCache;

function offsetsOf(id: string): number[] {
  return sourceFile
    .getDescendants()
    .filter((n): n is Node => Node.isIdentifier(n) && n.getText() === id)
    .map((n) => n.getStart());
}

function first(name: string): number {
  const all = offsetsOf(name);
  if (all.length === 0) throw new Error(`No identifier "${name}" found`);
  return all[0];
}

function nth(name: string, n: number): number {
  const all = offsetsOf(name);
  if (all.length <= n) throw new Error(`Identifier "${name}"[${n}] not found (have ${all.length})`);
  return all[n];
}

beforeEach(() => {
  project = new Project();
  sourceFile = project.createSourceFile('test.ts', SOURCE, { overwrite: true });
  cache = new AstCache(sourceFile);
});

describe('AstCache', () => {
  describe('getDefinition', () => {
    it('resolves a variable write reference to its declaration', () => {
      const writeRef = nth('count', 1);
      const answer = cache.getDefinition(writeRef);
      expect(answer).toEqual({ line: 5, text: 'count = 0' });
    });

    it('resolves a variable read reference to its declaration', () => {
      const readRef = nth('count', 2);
      const answer = cache.getDefinition(readRef);
      expect(answer?.line).toBe(5);
    });

    it('resolves a function call to its declaration', () => {
      const callRef = nth('greet', 1);
      const answer = cache.getDefinition(callRef);
      expect(answer).not.toBeNull();
      expect(answer!.line).toBe(1);
      expect(answer!.text).toContain('greet');
    });

    it('returns null for an offset that does not resolve to a symbol', () => {
      const answer = cache.getDefinition(999999);
      expect(answer).toBeNull();
    });
  });

  describe('getReferences', () => {
    it('finds all non-declaration usages of a variable', () => {
      const decl = first('count');
      const list = cache.getReferences(decl);

      const lines = list.map((r) => r.line);
      expect(lines).not.toContain(5);
      expect(lines).toContain(6);
      expect(lines.filter((l) => l === 6)).toHaveLength(2);
    });

    it('returns an empty array for an out-of-range offset', () => {
      const list = cache.getReferences(999999);
      expect(list).toEqual([]);
    });
  });

  describe('getType', () => {
    it('resolves the type of a parameter with explicit annotation', () => {
      const param = first('name');
      const answer = cache.getType(param);
      expect(answer).toEqual({ text: 'string' });
    });

    it('resolves the type of a variable from a call expression', () => {
      const msgs = first('msg');
      const answer = cache.getType(msgs);
      expect(answer).not.toBeNull();
      expect(answer!.text).toContain('string');
    });

    it('returns null for an out-of-range offset', () => {
      const answer = cache.getType(999999);
      expect(answer).toBeNull();
    });
  });

  describe('caching', () => {
    it('returns the same object reference on repeated calls', () => {
      const off = first('msg');
      const a = cache.getType(off);
      const b = cache.getType(off);
      expect(a).toBe(b);
    });

    it('caches different query kinds independently', () => {
      const off = first('msg');
      const typeA = cache.getType(off);
      const defA = cache.getDefinition(off);
      const typeB = cache.getType(off);
      const defB = cache.getDefinition(off);

      expect(typeA).toBe(typeB);
      expect(defA).toBe(defB);
      expect(typeA).not.toBe(defA);
    });

    it('caches different offsets independently', () => {
      const greetDecl = first('greet');
      const greetCall = nth('greet', 1);

      const defA = cache.getDefinition(greetDecl);
      const defB = cache.getDefinition(greetCall);

      expect(defA?.line).toBe(1);
      expect(defB?.line).toBe(1);
    });

    it('returns cached results quickly', () => {
      const off = first('count');

      cache.getReferences(off);

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        cache.getReferences(off);
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
    });
  });
});
