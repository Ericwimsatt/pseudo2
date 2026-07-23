import { describe, it, expect } from 'vitest';
import { buildFileData } from '../../../src/main/translationService/buildFileData';

interface RenderNode {
  spans: { text: string }[];
  children: RenderNode[];
}
interface RenderLine {
  nodes: RenderNode[];
}

function collectTexts(nodes: RenderNode[]): string[] {
  const out: string[] = [];
  function walk(ns: RenderNode[]) {
    for (const n of ns) {
      out.push(n.spans.map(s => s.text).join(''));
      walk(n.children);
    }
  }
  walk(nodes);
  return out;
}

function render(viewModel: { lines: RenderLine[] }): string[][] {
  return viewModel.lines
    .filter(l => l.nodes.length > 0)
    .map(l => collectTexts(l.nodes));
}

describe('makeSemanticGraph - switch statement', () => {
  it('handles switch with cases', () => {
    const source = `switch (x) {
  case 1:
    break;
  default:
    break;
}`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('x === 1')))).toBeTruthy();
    expect(lines.some(l => l.some(t => t.includes('otherwise')))).toBeTruthy();
  });

  it('handles switch with fallthrough', () => {
    const source = `switch (x) {
  case 1:
  case 2:
    break;
  default:
    break;
}`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('x === 1')))).toBeTruthy();
    expect(lines.some(l => l.some(t => t.includes('x === 2')))).toBeTruthy();
  });
});

describe('makeSemanticGraph - class declaration', () => {
  it('handles basic class with method', () => {
    const source = `class Foo {
  method() {}
}`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('Class Foo')))).toBeTruthy();
    expect(lines.some(l => l.some(t => t.includes('method')))).toBeTruthy();
  });

  it('handles class with constructor', () => {
    const source = `class Foo {
  constructor(x: string) {}
}`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('Class Foo')))).toBeTruthy();
  });
});

describe('makeSemanticGraph - object literal', () => {
  it('handles basic object literal', () => {
    const source = `const o = { a: 1, b: 2 };`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('{')))).toBeTruthy();
    expect(lines.some(l => l.some(t => t.includes('a: 1')))).toBeTruthy();
    expect(lines.some(l => l.some(t => t.includes('b: 2')))).toBeTruthy();
    expect(lines.some(l => l.some(t => t.includes('}')))).toBeTruthy();
  });

  it('handles object literal with method shorthand', () => {
    const source = `const o = { method() { return 1; } };`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('method()')))).toBeTruthy();
  });

  it('handles spread in object', () => {
    const source = `const o = { ...a, b: 2 };`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('...a')))).toBeTruthy();
    expect(lines.some(l => l.some(t => t.includes('b: 2')))).toBeTruthy();
  });
});

describe('makeSemanticGraph - destructuring', () => {
  it('handles array destructuring', () => {
    const source = `const [a, b] = arr;`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('a')))).toBeTruthy();
    expect(lines.some(l => l.some(t => t.includes('b')))).toBeTruthy();
  });

  it('handles object destructuring', () => {
    const source = `const { a, b } = obj;`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('a')))).toBeTruthy();
    expect(lines.some(l => l.some(t => t.includes('b')))).toBeTruthy();
  });
});

describe('makeSemanticGraph - loops', () => {
  it('handles for loop', () => {
    const source = `for (let i = 0; i < n; i++) {}`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('Loop')))).toBeTruthy();
  });

  it('handles for-of loop', () => {
    const source = `for (const x of arr) {}`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('For each')))).toBeTruthy();
  });

  it('handles for-in loop', () => {
    const source = `for (const key in obj) {}`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('For each')))).toBeTruthy();
  });

  it('handles while loop', () => {
    const source = `while (cond) {}`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('Loop')))).toBeTruthy();
  });

  it('handles do-while loop', () => {
    const source = `do {} while (cond);`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('Loop')))).toBeTruthy();
  });
});

describe('makeSemanticGraph - try/catch', () => {
  it('processes try/catch without error', () => {
    const source = `try { foo(); } catch(e) { console.log(e); }`;
    const { viewModel } = buildFileData(source, 'test.ts');
    expect(viewModel.lines.length).toBeGreaterThan(0);
  });
});

describe('makeSemanticGraph - throw', () => {
  it('processes throw without error', () => {
    const source = `throw new Error("fail");`;
    const { viewModel } = buildFileData(source, 'test.ts');
    expect(viewModel.lines.length).toBeGreaterThan(0);
  });
});

describe('makeSemanticGraph - export', () => {
  it('handles named exports', () => {
    const source = `export { foo, bar };`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('export')))).toBeTruthy();
  });
});

describe('makeSemanticGraph - async and generators', () => {
  it('handles async function', () => {
    const source = `async function foo() { return 1; }`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('Function foo')))).toBeTruthy();
  });

  it('handles generator function', () => {
    const source = `function* gen() { yield 1; }`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('Function gen')))).toBeTruthy();
  });
});

describe('makeSemanticGraph - optional chaining and nullish coalescing', () => {
  it('handles optional chaining', () => {
    const source = `const x = a?.b?.();`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('call')))).toBeTruthy();
  });

  it('handles nullish coalescing', () => {
    const source = `const x = a ?? b;`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('`x`')))).toBeTruthy();
  });
});

describe('makeSemanticGraph - exports', () => {
  it('handles default export function', () => {
    const source = `export default function() { return 1; }`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('Function')))).toBeTruthy();
  });

  it('handles export default declaration', () => {
    const source = `export default class Foo {}`;
    const { viewModel } = buildFileData(source, 'test.ts');
    const lines = render(viewModel);
    expect(lines.some(l => l.some(t => t.includes('Class Foo')))).toBeTruthy();
  });
});
