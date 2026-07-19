import { describe, it, expect, beforeEach } from 'vitest';
import { Project, Node, SourceFile } from 'ts-morph';
import { AstCache } from '../src/lib/astCache';

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
  describe('definition query', () => {
    it('resolves a variable write reference to its declaration', () => {
      // count offset order: decl (line 5), write (line 6), read (line 6)
      const writeRef = nth('count', 1);
      const answer = cache.answer(writeRef, 'definition');
      expect(answer).toEqual({
        kind: 'definition',
        data: { line: 5, text: 'count = 0' },
      });
    });

    it('resolves a variable read reference to its declaration', () => {
      const readRef = nth('count', 2); // right-side read on line 6
      const answer = cache.answer(readRef, 'definition');
      expect(answer.kind).toBe('definition');
      expect(answer.data?.line).toBe(5);
    });

    it('resolves a function call to its declaration', () => {
      // greet order: decl (line 1), call (line 7)
      const callRef = nth('greet', 1);
      const answer = cache.answer(callRef, 'definition');
      expect(answer.kind).toBe('definition');
      expect(answer.data).not.toBeNull();
      expect(answer.data!.line).toBe(1);
      expect(answer.data!.text).toContain('greet');
    });

    it('returns data: null for an offset that does not resolve to a symbol', () => {
      // An offset past the end of the file → no node → null
      const answer = cache.answer(999999, 'definition');
      expect(answer.kind).toBe('definition');
      expect(answer.data).toBeNull();
    });
  });

  describe('references query', () => {
    it('finds all non-declaration usages of a variable', () => {
      const decl = first('count'); // line 5 declaration
      const answer = cache.answer(decl, 'references');
      expect(answer.kind).toBe('references');

      // Declaration itself is excluded from the list
      const lines = answer.data.list.map((r) => r.line);
      expect(lines).not.toContain(5);
      expect(lines).toContain(6);
      // Two references on line 6 (write + read)
      expect(lines.filter((l) => l === 6)).toHaveLength(2);
    });

    it('returns an empty list for an out-of-range offset', () => {
      const answer = cache.answer(999999, 'references');
      expect(answer).toEqual({
        kind: 'references',
        data: { list: [] },
      });
    });
  });

  describe('type query', () => {
    it('resolves the type of a parameter with explicit annotation', () => {
      const param = first('name');
      const answer = cache.answer(param, 'type');
      expect(answer).toEqual({
        kind: 'type',
        data: { text: 'string' },
      });
    });

    it('resolves the type of the return value from a call expression', () => {
      // msgs identifier on line 7: const msg = greet("World")
      // The type of `msg` is the return type of greet, i.e. string
      const msgs = first('msg');
      const answer = cache.answer(msgs, 'type');
      expect(answer.kind).toBe('type');
      expect(answer.data).not.toBeNull();
      expect(answer.data!.text).toContain('string');
    });

    it('returns data: null for an out-of-range offset', () => {
      const answer = cache.answer(999999, 'type');
      expect(answer.kind).toBe('type');
      expect(answer.data).toBeNull();
    });
  });

  describe('caching', () => {
    it('returns the same object reference on repeated calls', () => {
      const off = first('msg');
      const a = cache.answer(off, 'type');
      const b = cache.answer(off, 'type');
      expect(a).toBe(b);
    });

    it('caches different query kinds independently', () => {
      const off = first('msg');
      const typeA = cache.answer(off, 'type');
      const defA = cache.answer(off, 'definition');
      const typeB = cache.answer(off, 'type');
      const defB = cache.answer(off, 'definition');

      expect(typeA).toBe(typeB);
      expect(defA).toBe(defB);
      // Different query kinds are different objects
      expect(typeA).not.toBe(defA);
    });

    it('caches different offsets independently', () => {
      const greetDecl = first('greet');
      const greetCall = nth('greet', 1);

      const defA = cache.answer(greetDecl, 'definition');
      const defB = cache.answer(greetCall, 'definition');

      expect(defA.data?.line).toBe(1);
      expect(defB.data?.line).toBe(1);
    });

    it('returns cached results quickly', () => {
      const off = first('count');

      // Warm cache
      cache.answer(off, 'references');

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        cache.answer(off, 'references');
      }
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
    });
  });

  describe('unknown query kind', () => {
    it('throws for an unrecognized query kind', () => {
      const off = first('greet');
      expect(() => cache.answer(off, 'nonexistent' as any)).toThrow();
    });
  });
});
