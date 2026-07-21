import { describe, it, expect } from 'vitest';
import { toDisplayNode } from '../../../src/main/translationService/renderable/phrasing';
import type { SemanticNode } from '../../../src/main/translationService/makeSemanticGraph';

function makeNode(type: string, overrides: Partial<SemanticNode> = {}): SemanticNode {
  return {
    type,
    name: undefined,
    children: [],
    metadata: {},
    indent: 0,
    sourceStartLine: 1,
    sourceEndLine: 1,
    ...overrides,
  };
}

function render(node: SemanticNode): string {
  return toDisplayNode(node).spans.map(s => s.text).join('');
}

describe('phrasing - import', () => {
  it('renders import with module and names', () => {
    const node = makeNode('import', {
      name: 'x',
      metadata: { module: './y' },
    });
    expect(render(node)).toContain('import');
    expect(render(node)).toContain('x');
    expect(render(node)).toContain('./y');
  });
});

describe('phrasing - export', () => {
  it('renders export with names', () => {
    const node = makeNode('export', {
      name: 'x',
      metadata: { module: '' },
    });
    expect(render(node)).toContain('export');
    expect(render(node)).toContain('x');
  });
});

describe('phrasing - function-definition', () => {
  it('renders function with name and no params', () => {
    const node = makeNode('function-definition', {
      name: 'foo',
      metadata: { parameters: [] },
    });
    expect(render(node)).toContain('Function foo');
  });

  it('renders function with parameters', () => {
    const node = makeNode('function-definition', {
      name: 'foo',
      metadata: { parameters: ['a', 'b'] },
    });
    expect(render(node)).toContain('Function foo');
    expect(render(node)).toContain('Parameters: a, b');
  });

  it('renders anonymous function with no params', () => {
    const node = makeNode('function-definition', {
      metadata: { parameters: [] },
    });
    expect(render(node)).toContain('(no parameters)');
  });
});

describe('phrasing - class', () => {
  it('renders class with name', () => {
    const node = makeNode('class', { name: 'Foo' });
    expect(render(node)).toContain('Class Foo');
  });

  it('renders class with extends', () => {
    const node = makeNode('class', {
      name: 'Foo',
      metadata: { extends: 'Bar' },
    });
    expect(render(node)).toContain('Class Foo');
    expect(render(node)).toContain('extends Bar');
  });
});

describe('phrasing - interface', () => {
  it('renders interface with name', () => {
    const node = makeNode('interface', { name: 'Foo' });
    expect(render(node)).toContain('Interface Foo');
  });
});

describe('phrasing - typeAlias', () => {
  it('renders type alias', () => {
    const node = makeNode('typeAlias', {
      name: 'Foo',
      metadata: { type: 'string' },
    });
    expect(render(node)).toContain('Type Foo as');
  });
});

describe('phrasing - property', () => {
  it('renders property with type', () => {
    const node = makeNode('property', {
      name: 'name',
      metadata: { type: 'string' },
    });
    expect(render(node)).toContain('`name`');
    expect(render(node)).toContain('text');
  });

  it('renders property with initializer', () => {
    const node = makeNode('property', {
      name: 'count',
      metadata: { type: 'number', initializer: '42' },
    });
    expect(render(node)).toContain('`count`');
    expect(render(node)).toContain('initialized to 42');
  });
});

describe('phrasing - variable-assignment', () => {
  it('renders variable assignment with value', () => {
    const node = makeNode('variable-assignment', {
      name: 'x',
      metadata: { initializer: '42' },
    });
    expect(render(node)).toContain('`x` = 42');
  });

  it('renders variable assignment with = when children present', () => {
    const node = makeNode('variable-assignment', {
      name: 'x',
      children: [makeNode('call-function', { metadata: { function: 'foo' } })],
      metadata: { initializer: null },
    });
    expect(render(node)).toContain('`x` =');
  });
});

describe('phrasing - return', () => {
  it('renders return with value', () => {
    const node = makeNode('return', {
      metadata: { value: 'x', hasJsx: false },
    });
    expect(render(node)).toContain('return');
    expect(render(node)).toContain('`x`');
  });

  it('renders return with JSX', () => {
    const node = makeNode('return', {
      metadata: { value: null, hasJsx: true },
    });
    expect(render(node)).toContain('Return Visual Elements:');
  });

  it('renders bare return', () => {
    const node = makeNode('return', {
      metadata: { value: null, hasJsx: false },
    });
    expect(render(node)).toBe('return');
  });
});

describe('phrasing - if', () => {
  it('renders if with condition', () => {
    const node = makeNode('if', {
      metadata: { condition: 'x > 0' },
    });
    expect(render(node)).toContain('If x > 0');
  });
});

describe('phrasing - loop', () => {
  it('renders for of loop', () => {
    const node = makeNode('loop', {
      metadata: { loopType: 'forOf' },
    });
    expect(render(node)).toContain('For each item');
  });

  it('renders for in loop', () => {
    const node = makeNode('loop', {
      metadata: { loopType: 'forIn' },
    });
    expect(render(node)).toContain('For each key');
  });

  it('renders while loop', () => {
    const node = makeNode('loop', {
      metadata: { loopType: 'while' },
    });
    expect(render(node)).toContain('Loop');
  });
});

describe('phrasing - call-function', () => {
  it('renders function call', () => {
    const node = makeNode('call-function', {
      metadata: { function: 'foo' },
    });
    expect(render(node)).toContain('Call foo');
  });

  it('renders method call', () => {
    const node = makeNode('call-function', {
      metadata: { function: 'obj.method' },
    });
    expect(render(node)).toContain('Call obj.method');
  });

  it('renders instantiation', () => {
    const node = makeNode('call-function', {
      metadata: { function: 'Foo', isNew: true },
    });
    expect(render(node)).toContain('Instantiate Foo');
  });
});

describe('phrasing - jsx-element', () => {
  it('renders opening element', () => {
    const node = makeNode('jsx-element', {
      name: 'div',
      metadata: { tagDescription: 'container' },
    });
    const result = render(node);
    expect(result).toContain('<div');
    expect(result).toContain('>');
  });

  it('renders self-closing element', () => {
    const node = makeNode('jsx-element', {
      name: 'br',
      metadata: { tagDescription: 'line break', selfClosing: true },
    });
    const result = render(node);
    expect(result).toContain('<br');
    expect(result).toContain('/>');
  });
});

describe('phrasing - jsx-expression', () => {
  it('renders simple identifier', () => {
    const node = makeNode('jsx-expression', {
      metadata: { expression: 'name', isSimpleIdentifier: true },
    });
    expect(render(node)).toContain('Show:');
    expect(render(node)).toContain('name');
  });

  it('renders template expression', () => {
    const node = makeNode('jsx-expression', {
      metadata: { expression: '`Hello ${name}`', isTemplate: true },
    });
    expect(render(node)).toContain('Show dynamic text:');
  });
});

describe('phrasing - jsx-conditional', () => {
  it('renders ternary conditional', () => {
    const node = makeNode('jsx-conditional', {
      metadata: { condition: 'cond', variant: 'ternary' },
    });
    expect(render(node)).toContain('If cond, show:');
  });

  it('renders alt branch', () => {
    const node = makeNode('jsx-conditional-alt', {});
    expect(render(node)).toContain('Otherwise, show:');
  });
});

describe('phrasing - jsx-list', () => {
  it('renders map list', () => {
    const node = makeNode('jsx-list', {
      metadata: { itemName: 'i', collection: 'items' },
    });
    expect(render(node)).toContain('For each i in items');
  });
});

describe('phrasing - jsx-filter', () => {
  it('renders filter', () => {
    const node = makeNode('jsx-filter', {
      metadata: { collection: 'items', condition: 'x > 0' },
    });
    expect(render(node)).toContain('Filter items where x > 0');
  });
});

describe('phrasing - else chains', () => {
  it('renders otherwise-if', () => {
    const node = makeNode('otherwise-if', {
      metadata: { condition: 'y > 0' },
    });
    expect(render(node)).toContain('otherwise if y > 0');
  });

  it('renders otherwise', () => {
    const node = makeNode('otherwise', {});
    expect(render(node)).toContain('otherwise');
  });
});

describe('phrasing - object-literal', () => {
  it('renders opening brace', () => {
    const node = makeNode('object-literal', {});
    expect(render(node)).toBe('{');
  });

  it('renders closing brace', () => {
    const node = makeNode('object-literal-close', {});
    expect(render(node)).toBe('}');
  });

  it('renders property', () => {
    const node = makeNode('object-property', {
      name: 'a',
      metadata: { value: '1' },
    });
    expect(render(node)).toBe('a: 1');
  });

  it('renders spread property', () => {
    const node = makeNode('object-property', {
      name: '...other',
      metadata: { value: '', isSpread: true },
    });
    expect(render(node)).toBe('...other');
  });

  it('renders method shorthand', () => {
    const node = makeNode('object-property', {
      name: 'methodName',
      metadata: { value: '<method>', isMethod: true },
    });
    expect(render(node)).toBe('methodName()');
  });
});

describe('phrasing - jsx attrs', () => {
  it('renders className attr', () => {
    const node = makeNode('jsx-element', {
      name: 'div',
      metadata: {
        tagDescription: 'container',
        className: '"flex"',
        classNameDescription: 'flex layout',
      },
    });
    const result = render(node);
    expect(result).toContain('className=');
    expect(result).toContain('flex');
  });

  it('renders event handler', () => {
    const node = makeNode('jsx-element', {
      name: 'button',
      metadata: {
        tagDescription: 'button',
        events: [{ name: 'onClick', description: 'when clicked', handlerName: 'handleClick' }],
      },
    });
    const result = render(node);
    expect(result).toContain('onClick');
  });
});

describe('phrasing - fallback', () => {
  it('renders unknown node type', () => {
    const node = makeNode('unknown-node-type', {});
    expect(render(node)).toContain('[unknown-node-type]');
  });
});
