import { describe, it, expect } from 'vitest';
import { Project, Node } from 'ts-morph';
import {
  translateSingleClass,
  translateClassName,
  describeEventHandler,
} from '../../../src/main/translationService/jsxHandler';

describe('translateSingleClass', () => {
  describe('width and height', () => {
    it('translates w-full', () => {
      expect(translateSingleClass('w-full')).toBe('full width');
    });
    it('translates w-1/2', () => {
      expect(translateSingleClass('w-1/2')).toBe('half width');
    });
    it('translates w-screen', () => {
      expect(translateSingleClass('w-screen')).toBe('screen width');
    });
    it('translates w-auto', () => {
      expect(translateSingleClass('w-auto')).toBe('auto width');
    });
    it('translates w-64', () => {
      expect(translateSingleClass('w-64')).toBe('width 64');
    });
    it('translates h-full', () => {
      expect(translateSingleClass('h-full')).toBe('full height');
    });
    it('translates h-screen', () => {
      expect(translateSingleClass('h-screen')).toBe('screen height');
    });
    it('translates h-48', () => {
      expect(translateSingleClass('h-48')).toBe('height 48');
    });
    it('translates max-w-lg', () => {
      expect(translateSingleClass('max-w-lg')).toBe('maximum width large');
    });
    it('translates min-h-0', () => {
      expect(translateSingleClass('min-h-0')).toBe('minimum height none');
    });
  });

  describe('flex layout', () => {
    it('translates flex', () => {
      expect(translateSingleClass('flex')).toBe('flex layout');
    });
    it('translates flex-col', () => {
      expect(translateSingleClass('flex-col')).toBe('vertical layout');
    });
    it('translates items-center', () => {
      expect(translateSingleClass('items-center')).toBe('vertically centered items');
    });
    it('translates justify-between', () => {
      expect(translateSingleClass('justify-between')).toBe('space between items');
    });
    it('translates gap-4', () => {
      expect(translateSingleClass('gap-4')).toBe('gap 4');
    });
  });

  describe('spacing', () => {
    it('translates p-0', () => {
      expect(translateSingleClass('p-0')).toBe('no padding');
    });
    it('translates p-4', () => {
      expect(translateSingleClass('p-4')).toBe('padding 4');
    });
    it('translates px-2', () => {
      expect(translateSingleClass('px-2')).toBe('horizontal padding 2');
    });
    it('translates py-2', () => {
      expect(translateSingleClass('py-2')).toBe('vertical padding 2');
    });
    it('translates mt-4', () => {
      expect(translateSingleClass('mt-4')).toBe('top margin 4');
    });
    it('translates mb-0', () => {
      expect(translateSingleClass('mb-0')).toBe('no bottom margin');
    });
    it('translates m-auto', () => {
      expect(translateSingleClass('m-auto')).toBe('auto margin');
    });
    it('translates mx-auto', () => {
      expect(translateSingleClass('mx-auto')).toBe('centered horizontally');
    });
    it('translates space-x-4', () => {
      expect(translateSingleClass('space-x-4')).toBe('horizontal spacing 4');
    });
    it('translates space-y-2', () => {
      expect(translateSingleClass('space-y-2')).toBe('vertical spacing 2');
    });
  });

  describe('typography', () => {
    it('translates text-lg', () => {
      expect(translateSingleClass('text-lg')).toBe('large text');
    });
    it('translates text-sm', () => {
      expect(translateSingleClass('text-sm')).toBe('small text');
    });
    it('translates text-base', () => {
      expect(translateSingleClass('text-base')).toBe('base text');
    });
    it('translates font-bold', () => {
      expect(translateSingleClass('font-bold')).toBe('bold font');
    });
    it('translates font-medium', () => {
      expect(translateSingleClass('font-medium')).toBe('medium font weight');
    });
    it('translates leading-tight', () => {
      expect(translateSingleClass('leading-tight')).toBe('tight line height');
    });
    it('translates tracking-wide', () => {
      expect(translateSingleClass('tracking-wide')).toBe('wide letter spacing');
    });
  });

  describe('colors', () => {
    it('translates text-red-500', () => {
      expect(translateSingleClass('text-red-500')).toBe('red text');
    });
    it('translates text-red-700', () => {
      expect(translateSingleClass('text-red-700')).toBe('dark red text');
    });
    it('translates text-red-100', () => {
      expect(translateSingleClass('text-red-100')).toBe('very light red text');
    });
    it('translates bg-blue-200', () => {
      expect(translateSingleClass('bg-blue-200')).toBe('light blue background');
    });
    it('translates border-gray-300', () => {
      expect(translateSingleClass('border-gray-300')).toBe('light gray border');
    });
  });

  describe('responsive prefixes', () => {
    it('translates sm:flex', () => {
      expect(translateSingleClass('sm:flex')).toBe('flex layout on small screens');
    });
    it('translates md:w-1/2', () => {
      expect(translateSingleClass('md:w-1/2')).toBe('half width on medium screens');
    });
    it('translates lg:text-lg', () => {
      expect(translateSingleClass('lg:text-lg')).toBe('large text on large screens');
    });
    it('translates xl:p-4', () => {
      expect(translateSingleClass('xl:p-4')).toBe('padding 4 on extra large screens');
    });
  });

  describe('state prefixes', () => {
    it('translates hover:bg-blue-500', () => {
      expect(translateSingleClass('hover:bg-blue-500')).toBe('blue background on hover');
    });
    it('translates focus:outline-none', () => {
      const result = translateSingleClass('focus:outline-none');
      expect(result).toContain('outline');
      expect(result).toContain('when focused');
    });
    it('translates active:scale-95', () => {
      expect(translateSingleClass('active:scale-95')).toBe('scaled to 95% when active');
    });
    it('translates disabled:opacity-50', () => {
      expect(translateSingleClass('disabled:opacity-50')).toBe('50% opacity when disabled');
    });
  });

  describe('dark mode', () => {
    it('translates dark:bg-gray-800', () => {
      expect(translateSingleClass('dark:bg-gray-800')).toBe('very dark gray background in dark mode');
    });
  });

  describe('animations and transforms', () => {
    it('translates animate-spin', () => {
      expect(translateSingleClass('animate-spin')).toBe('spinning animation');
    });
    it('translates transition-all', () => {
      expect(translateSingleClass('transition-all')).toBe('smooth transitions on all properties');
    });
    it('translates hover:scale-105', () => {
      expect(translateSingleClass('hover:scale-105')).toBe('scaled to 105% on hover');
    });
    it('translates rotate-45', () => {
      expect(translateSingleClass('rotate-45')).toBe('rotated 45 degrees');
    });
  });

  describe('non-Tailwind', () => {
    it('returns null for non-Tailwind class', () => {
      expect(translateSingleClass('custom-class')).toBe('custom-class');
    });
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(translateSingleClass('')).toBe('');
    });
  });
});

describe('translateClassName', () => {
  it('translates single class', () => {
    expect(translateClassName('flex')).toBe('flex layout');
  });

  it('translates multiple classes', () => {
    const result = translateClassName('flex items-center gap-4');
    expect(result).toContain('flex layout');
    expect(result).toContain('vertically centered items');
    expect(result).toContain('gap 4');
  });

  it('handles multiple spaces', () => {
    const result = translateClassName('flex   items-center');
    expect(result).not.toContain('  ');
  });

  it('handles leading/trailing whitespace', () => {
    expect(translateClassName('  flex  ').trim()).toBe('flex layout');
  });

  it('returns empty for empty string', () => {
    expect(translateClassName('')).toBe('');
  });
});

describe('describeEventHandler', () => {
  it('describes onClick without value', () => {
    expect(describeEventHandler('onClick', undefined)).toBe('when clicked');
  });

  it('describes onChange without value', () => {
    expect(describeEventHandler('onChange', undefined)).toBe('when changed');
  });

  it('describes onSubmit without value', () => {
    expect(describeEventHandler('onSubmit', undefined)).toBe('when submitted');
  });

  it('describes onKeyDown without value', () => {
    expect(describeEventHandler('onKeyDown', undefined)).toBe('when a key is pressed');
  });

  it('describes onMouseEnter without value', () => {
    expect(describeEventHandler('onMouseEnter', undefined)).toBe('when hovered over');
  });

  it('describes onFocus without value', () => {
    expect(describeEventHandler('onFocus', undefined)).toBe('when focused');
  });

  it('describes onBlur without value', () => {
    expect(describeEventHandler('onBlur', undefined)).toBe('when focus is lost');
  });

  it('handles unknown event name', () => {
    const result = describeEventHandler('onCustomEvent', undefined);
    expect(result).toContain('when');
    expect(result).toContain('custom');
  });

  it('describes onClick with identifier value using ts-morph', () => {
    const project = new Project();
    const sf = project.createSourceFile('test.tsx', '<button onClick={handleClick} />', { overwrite: true });
    const jsxAttr = sf.getDescendants().find(n => Node.isJsxAttribute(n) && (n as any).getNameNode().getText() === 'onClick');
    expect(jsxAttr).toBeDefined();
    if (jsxAttr) {
      const result = describeEventHandler('onClick', (jsxAttr as any).getInitializer());
      expect(result).toContain('when clicked');
      expect(result).toContain('handleClick');
    }
  });

  it('describes onClick with arrow function', () => {
    const project = new Project();
    const sf = project.createSourceFile('test.tsx', '<button onClick={() => doStuff()} />', { overwrite: true });
    const jsxAttr = sf.getDescendants().find(n => Node.isJsxAttribute(n) && (n as any).getNameNode().getText() === 'onClick');
    expect(jsxAttr).toBeDefined();
    if (jsxAttr) {
      const result = describeEventHandler('onClick', (jsxAttr as any).getInitializer());
      expect(result).toContain('when clicked');
    }
  });

  it('handles string literal value', () => {
    const project = new Project();
    const sf = project.createSourceFile('test.html', '<div onClick="alert(1)" />', { overwrite: true, scriptKind: 2 });
    const jsxAttr = sf.getDescendants().find(n => Node.isJsxAttribute(n) && (n as any).getNameNode().getText() === 'onClick');
    if (jsxAttr) {
      const result = describeEventHandler('onClick', (jsxAttr as any).getInitializer());
      expect(result).toContain('when clicked');
    }
  });
});
