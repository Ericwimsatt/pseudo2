import * as ts from 'typescript';
import type { SemanticNode } from './makeSemanticGraph';

function getNodeLineRange(node: ts.Node, sourceFile: ts.SourceFile): { start: number; end: number } {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return { start: start.line + 1, end: end.line + 1 };
}

const TAG_DESCRIPTIONS: Record<string, string> = {
  div: 'container',
  span: 'inline text',
  p: 'paragraph',
  h1: 'level 1 heading',
  h2: 'level 2 heading',
  h3: 'level 3 heading',
  h4: 'level 4 heading',
  h5: 'level 5 heading',
  h6: 'level 6 heading',
  button: 'button',
  a: 'link',
  img: 'image',
  input: 'input field',
  form: 'form',
  ul: 'unordered list',
  ol: 'ordered list',
  li: 'list item',
  table: 'table',
  thead: 'table header section',
  tbody: 'table body',
  tr: 'table row',
  td: 'table cell',
  th: 'table header cell',
  header: 'header section',
  footer: 'footer section',
  nav: 'navigation',
  main: 'main content area',
  section: 'section',
  article: 'article',
  aside: 'sidebar',
  label: 'label',
  select: 'dropdown',
  option: 'dropdown option',
  textarea: 'text area',
  svg: 'SVG graphic',
  path: 'SVG path',
  circle: 'SVG circle',
  rect: 'SVG rectangle',
  line: 'SVG line',
  g: 'SVG group',
  canvas: 'canvas',
  video: 'video player',
  audio: 'audio player',
  iframe: 'embedded frame',
  hr: 'horizontal divider',
  br: 'line break',
  pre: 'preformatted text',
  code: 'code block',
  blockquote: 'blockquote',
  strong: 'bold text',
  em: 'italic text',
  small: 'small text',
  sub: 'subscript text',
  sup: 'superscript text',
  details: 'expandable details',
  summary: 'summary',
  dialog: 'dialog',
  progress: 'progress bar',
  meter: 'meter',
};

const EVENT_DESCRIPTIONS: Record<string, string> = {
  onClick: 'when clicked',
  onChange: 'when changed',
  onSubmit: 'when submitted',
  onKeyDown: 'when a key is pressed',
  onKeyUp: 'when a key is released',
  onKeyPress: 'when a key is typed',
  onFocus: 'when focused',
  onBlur: 'when focus is lost',
  onMouseEnter: 'when hovered over',
  onMouseLeave: 'when mouse leaves',
  onMouseDown: 'when mouse is pressed',
  onMouseUp: 'when mouse is released',
  onScroll: 'when scrolled',
  onDoubleClick: 'when double-clicked',
  onDrag: 'when dragged',
  onDrop: 'when dropped',
  onLoad: 'when loaded',
  onError: 'when an error occurs',
  onInput: 'when input is received',
  onReset: 'when reset',
  onSelect: 'when text is selected',
  onTouchStart: 'when touch begins',
  onTouchEnd: 'when touch ends',
  onTouchMove: 'when touch moves',
};

const STATE_PREFIXES: Record<string, string> = {
  hover: 'on hover',
  focus: 'when focused',
  active: 'when active',
  disabled: 'when disabled',
  'group-hover': 'when parent is hovered',
  'group-focus': 'when parent is focused',
  dark: 'in dark mode',
  first: 'for first item',
  last: 'for last item',
  odd: 'for odd items',
  even: 'for even items',
  placeholder: 'for placeholder',
  checked: 'when checked',
  'focus-within': 'when child is focused',
  'focus-visible': 'when focused via keyboard',
};

const RESPONSIVE_PREFIXES: Record<string, string> = {
  sm: 'on small screens',
  md: 'on medium screens',
  lg: 'on large screens',
  xl: 'on extra large screens',
  '2xl': 'on very large screens',
};

const EXACT_CLASSES: Record<string, string> = {
  flex: 'flex layout',
  'inline-flex': 'inline flex layout',
  grid: 'grid layout',
  'inline-grid': 'inline grid layout',
  block: 'block display',
  'inline-block': 'inline block display',
  inline: 'inline display',
  hidden: 'hidden',
  contents: 'contents display',
  'items-start': 'items aligned to start',
  'items-end': 'items aligned to end',
  'items-center': 'vertically centered items',
  'items-stretch': 'stretched items',
  'items-baseline': 'items aligned to baseline',
  'justify-start': 'items packed to start',
  'justify-end': 'items packed to end',
  'justify-center': 'horizontally centered items',
  'justify-between': 'space between items',
  'justify-around': 'space around items',
  'justify-evenly': 'even space between items',
  'flex-row': 'horizontal layout',
  'flex-col': 'vertical layout',
  'flex-row-reverse': 'reversed horizontal layout',
  'flex-col-reverse': 'reversed vertical layout',
  'flex-wrap': 'wrapping items',
  'flex-nowrap': 'non-wrapping items',
  'flex-1': 'fills available space',
  'flex-auto': 'sizes based on content',
  'flex-none': 'fixed size',
  'self-start': 'aligned to start',
  'self-end': 'aligned to end',
  'self-center': 'self-centered',
  'self-stretch': 'self-stretched',
  relative: 'relative positioning',
  absolute: 'absolute positioning',
  fixed: 'fixed positioning',
  sticky: 'sticky positioning',
  static: 'static positioning',
  'overflow-hidden': 'hidden overflow',
  'overflow-auto': 'auto overflow',
  'overflow-scroll': 'scrollable overflow',
  'overflow-visible': 'visible overflow',
  'overflow-x-auto': 'horizontal auto overflow',
  'overflow-y-auto': 'vertical auto overflow',
  'cursor-pointer': 'pointer cursor',
  'cursor-not-allowed': 'not-allowed cursor',
  'cursor-grab': 'grab cursor',
  'cursor-wait': 'waiting cursor',
  'select-none': 'non-selectable text',
  'select-all': 'fully selectable text',
  'pointer-events-none': 'ignores pointer events',
  transition: 'smooth transitions',
  'transition-all': 'smooth transitions on all properties',
  'transition-colors': 'smooth color transitions',
  'transition-opacity': 'smooth opacity transitions',
  'transition-transform': 'smooth transform transitions',
  'animate-spin': 'spinning animation',
  'animate-pulse': 'pulsing animation',
  'animate-bounce': 'bouncing animation',
  'animate-ping': 'pinging animation',
  truncate: 'truncated text with ellipsis',
  'sr-only': 'screen reader only',
  'not-sr-only': 'visible (not screen reader only)',
  'list-none': 'no list markers',
  'list-disc': 'disc list markers',
  'list-decimal': 'numbered list markers',
  'object-cover': 'covers container',
  'object-contain': 'contained within container',
  'object-fill': 'fills container',
  'break-words': 'wraps long words',
  'break-all': 'breaks at any character',
  'whitespace-nowrap': 'no text wrapping',
  'whitespace-pre': 'preserves whitespace',
  'text-left': 'left-aligned text',
  'text-center': 'centered text',
  'text-right': 'right-aligned text',
  'text-justify': 'justified text',
  uppercase: 'uppercase text',
  lowercase: 'lowercase text',
  capitalize: 'capitalized text',
  'normal-case': 'normal case text',
  underline: 'underlined text',
  'line-through': 'strikethrough text',
  'no-underline': 'no underline',
  italic: 'italic text',
  'not-italic': 'normal (non-italic) text',
  'font-thin': 'thin font',
  'font-light': 'light font',
  'font-normal': 'normal font weight',
  'font-medium': 'medium font weight',
  'font-semibold': 'semi-bold font',
  'font-bold': 'bold font',
  'font-extrabold': 'extra bold font',
  'font-black': 'black font weight',
};

const COLOR_NAMES: Record<string, string> = {
  slate: 'slate',
  gray: 'gray',
  grey: 'gray',
  zinc: 'zinc',
  neutral: 'neutral',
  stone: 'stone',
  red: 'red',
  orange: 'orange',
  amber: 'amber',
  yellow: 'yellow',
  lime: 'lime',
  green: 'green',
  emerald: 'emerald',
  teal: 'teal',
  cyan: 'cyan',
  sky: 'sky blue',
  blue: 'blue',
  indigo: 'indigo',
  violet: 'violet',
  purple: 'purple',
  fuchsia: 'fuchsia',
  pink: 'pink',
  rose: 'rose',
  white: 'white',
  black: 'black',
  transparent: 'transparent',
  current: 'current color',
  inherit: 'inherited',
};

function colorIntensity(shade: string): string {
  const n = parseInt(shade, 10);
  if (isNaN(n)) return '';
  if (n <= 100) return 'very light ';
  if (n <= 200) return 'light ';
  if (n <= 300) return 'light ';
  if (n <= 500) return '';
  if (n <= 600) return 'dark ';
  if (n <= 700) return 'dark ';
  if (n <= 800) return 'very dark ';
  return 'very dark ';
}

function translateColor(value: string): string {
  if (COLOR_NAMES[value]) return COLOR_NAMES[value];
  const match = value.match(/^([a-z]+)-(\d+)$/);
  if (match) {
    const name = COLOR_NAMES[match[1]] || match[1];
    const intensity = colorIntensity(match[2]);
    return `${intensity}${name}`;
  }
  return value;
}

const PREFIX_TRANSLATORS: Array<[string, (value: string) => string]> = [
  ['bg-gradient-to-', (v) => `gradient to ${v.replace('-', ' ')}`],
  ['bg-', (v) => `${translateColor(v)} background`],
  ['text-', (v) => {
    if (/^\[/.test(v)) return `${v.slice(1, -1)} text`;
    if (/^(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/.test(v)) {
      const sizes: Record<string, string> = {
        xs: 'extra small', sm: 'small', base: 'base', lg: 'large', xl: 'extra large',
        '2xl': '2x large', '3xl': '3x large', '4xl': '4x large', '5xl': '5x large',
        '6xl': '6x large', '7xl': '7x large', '8xl': '8x large', '9xl': '9x large',
      };
      return `${sizes[v] || v} text`;
    }
    return `${translateColor(v)} text`;
  }],
  ['border-', (v) => {
    if (/^\d+$/.test(v)) return `${v}px border`;
    if (/^(t|b|l|r|x|y)-\d+$/.test(v)) return `${v} border`;
    return `${translateColor(v)} border`;
  }],
  ['ring-', (v) => {
    if (/^\d+$/.test(v)) return `${v}px ring`;
    return `${translateColor(v)} ring`;
  }],
  ['shadow-', (v) => {
    const sizes: Record<string, string> = { sm: 'small', md: 'medium', lg: 'large', xl: 'extra large', '2xl': '2x large', inner: 'inner' };
    return sizes[v] ? `${sizes[v]} shadow` : `${translateColor(v)} shadow`;
  }],
  ['rounded-', (v) => {
    const sizes: Record<string, string> = { sm: 'slightly rounded', md: 'rounded', lg: 'very rounded', xl: 'very rounded', '2xl': 'heavily rounded', '3xl': 'heavily rounded', full: 'fully rounded (pill shape)', none: 'square corners' };
    if (sizes[v]) return sizes[v];
    if (/^(t|b|l|r|tl|tr|bl|br)(-(sm|md|lg|xl|2xl|3xl|full))?$/.test(v)) return `rounded ${v}`;
    return `rounded ${v}`;
  }],
  ['opacity-', (v) => `${parseInt(v, 10)}% opacity`],
  ['z-', (v) => `z-index ${v}`],
  ['top-', (v) => `top offset ${v}`],
  ['right-', (v) => `right offset ${v}`],
  ['bottom-', (v) => `bottom offset ${v}`],
  ['left-', (v) => `left offset ${v}`],
  ['inset-', (v) => `inset ${v}`],
  ['w-', (v) => {
    if (v === 'full') return 'full width';
    if (v === 'screen') return 'screen width';
    if (v === 'auto') return 'auto width';
    if (v === '1/2') return 'half width';
    if (v === '1/3') return 'one-third width';
    if (v === '2/3') return 'two-thirds width';
    if (v === '1/4') return 'quarter width';
    if (v === '3/4') return 'three-quarter width';
    if (/^\[/.test(v)) return `width ${v.slice(1, -1)}`;
    return `width ${v}`;
  }],
  ['h-', (v) => {
    if (v === 'full') return 'full height';
    if (v === 'screen') return 'screen height';
    if (v === 'auto') return 'auto height';
    if (/^\[/.test(v)) return `height ${v.slice(1, -1)}`;
    return `height ${v}`;
  }],
  ['min-w-', (v) => `minimum width ${v === '0' ? 'none' : v}`],
  ['min-h-', (v) => `minimum height ${v === '0' ? 'none' : v}`],
  ['max-w-', (v) => {
    const sizes: Record<string, string> = { xs: 'extra small', sm: 'small', md: 'medium', lg: 'large', xl: 'extra large', '2xl': '2x large', '3xl': '3x large', '4xl': '4x large', '5xl': '5x large', '6xl': '6x large', '7xl': '7x large', full: 'full', none: 'unlimited' };
    return `maximum width ${sizes[v] || v}`;
  }],
  ['max-h-', (v) => `maximum height ${v}`],
  ['gap-', (v) => `gap ${v}`],
  ['gap-x-', (v) => `horizontal gap ${v}`],
  ['gap-y-', (v) => `vertical gap ${v}`],
  ['space-x-', (v) => `horizontal spacing ${v}`],
  ['space-y-', (v) => `vertical spacing ${v}`],
  ['p-', (v) => v === '0' ? 'no padding' : `padding ${v}`],
  ['px-', (v) => v === '0' ? 'no horizontal padding' : `horizontal padding ${v}`],
  ['py-', (v) => v === '0' ? 'no vertical padding' : `vertical padding ${v}`],
  ['pt-', (v) => v === '0' ? 'no top padding' : `top padding ${v}`],
  ['pr-', (v) => v === '0' ? 'no right padding' : `right padding ${v}`],
  ['pb-', (v) => v === '0' ? 'no bottom padding' : `bottom padding ${v}`],
  ['pl-', (v) => v === '0' ? 'no left padding' : `left padding ${v}`],
  ['m-', (v) => v === '0' ? 'no margin' : v === 'auto' ? 'auto margin' : `margin ${v}`],
  ['mx-', (v) => v === '0' ? 'no horizontal margin' : v === 'auto' ? 'centered horizontally' : `horizontal margin ${v}`],
  ['my-', (v) => v === '0' ? 'no vertical margin' : v === 'auto' ? 'auto vertical margin' : `vertical margin ${v}`],
  ['mt-', (v) => v === '0' ? 'no top margin' : `top margin ${v}`],
  ['mr-', (v) => v === '0' ? 'no right margin' : `right margin ${v}`],
  ['mb-', (v) => v === '0' ? 'no bottom margin' : `bottom margin ${v}`],
  ['ml-', (v) => v === '0' ? 'no left margin' : `left margin ${v}`],
  ['-m-', (v) => `negative margin ${v}`],
  ['-mt-', (v) => `negative top margin ${v}`],
  ['-mr-', (v) => `negative right margin ${v}`],
  ['-mb-', (v) => `negative bottom margin ${v}`],
  ['-ml-', (v) => `negative left margin ${v}`],
  ['grid-cols-', (v) => `${v} column grid`],
  ['grid-rows-', (v) => `${v} row grid`],
  ['col-span-', (v) => `spans ${v} columns`],
  ['row-span-', (v) => `spans ${v} rows`],
  ['duration-', (v) => `${v}ms duration`],
  ['delay-', (v) => `${v}ms delay`],
  ['ease-', (v) => `${v.replace('-', ' ')} easing`],
  ['rotate-', (v) => `rotated ${v} degrees`],
  ['scale-', (v) => `scaled to ${parseInt(v, 10)}%`],
  ['translate-x-', (v) => `shifted right by ${v}`],
  ['translate-y-', (v) => `shifted down by ${v}`],
  ['skew-x-', (v) => `skewed horizontally ${v}`],
  ['skew-y-', (v) => `skewed vertically ${v}`],
  ['leading-', (v) => {
    const sizes: Record<string, string> = { none: 'no line height', tight: 'tight line height', snug: 'snug line height', normal: 'normal line height', relaxed: 'relaxed line height', loose: 'loose line height' };
    return sizes[v] || `line height ${v}`;
  }],
  ['tracking-', (v) => {
    const sizes: Record<string, string> = { tighter: 'tighter letter spacing', tight: 'tight letter spacing', normal: 'normal letter spacing', wide: 'wide letter spacing', wider: 'wider letter spacing', widest: 'widest letter spacing' };
    return sizes[v] || `letter spacing ${v}`;
  }],
  ['border-', (v) => {
    if (v === 'solid') return 'solid border';
    if (v === 'dashed') return 'dashed border';
    if (v === 'dotted') return 'dotted border';
    if (v === 'double') return 'double border';
    if (v === 'none') return 'no border';
    return `${v} border`;
  }],
  ['aspect-', (v) => `aspect ratio ${v.replace('/', ':')}`],
  ['origin-', (v) => `transform origin ${v.replace('-', ' ')}`],
  ['placeholder-', (v) => `${translateColor(v)} placeholder`],
  ['outline-', (v) => {
    if (/^\d+$/.test(v)) return `${v}px outline`;
    return `${translateColor(v)} outline`;
  }],
  ['backdrop-', (v) => `backdrop ${v}`],
  ['divide-x-', (v) => `vertical dividers ${v}`],
  ['divide-y-', (v) => `horizontal dividers ${v}`],
];

function translateSingleClass(cls: string): string {
  let prefix = '';
  let base = cls;

  const allPrefixes = { ...STATE_PREFIXES, ...RESPONSIVE_PREFIXES };
  const prefixMatch = cls.match(/^([a-z-]+):(.+)$/);
  if (prefixMatch && allPrefixes[prefixMatch[1]]) {
    prefix = allPrefixes[prefixMatch[1]];
    base = prefixMatch[2];
  }

  if (EXACT_CLASSES[base]) {
    return prefix ? `${EXACT_CLASSES[base]} ${prefix}` : EXACT_CLASSES[base];
  }

  if (base === 'border') {
    return prefix ? `border ${prefix}` : 'border';
  }
  if (base === 'rounded') {
    return prefix ? `rounded corners ${prefix}` : 'rounded corners';
  }
  if (base === 'shadow') {
    return prefix ? `shadow ${prefix}` : 'shadow';
  }
  if (base === 'ring') {
    return prefix ? `ring ${prefix}` : 'ring';
  }
  if (base === 'font-italic') {
    return prefix ? `italic text ${prefix}` : 'italic text';
  }

  if (base.startsWith('-')) {
    const positive = base.slice(1);
    for (const [classPrefix, translator] of PREFIX_TRANSLATORS) {
      if (positive.startsWith(classPrefix)) {
        const value = positive.slice(classPrefix.length);
        const desc = translator(value);
        const negated = desc.replace(/^(padding|margin|top margin|right margin|bottom margin|left margin|horizontal margin|vertical margin)/, 'negative $1');
        return prefix ? `${negated} ${prefix}` : negated;
      }
    }
  }

  for (const [classPrefix, translator] of PREFIX_TRANSLATORS) {
    if (base.startsWith(classPrefix)) {
      const value = base.slice(classPrefix.length);
      if (value) {
        const desc = translator(value);
        return prefix ? `${desc} ${prefix}` : desc;
      }
    }
  }

  return prefix ? `${cls} ${prefix}` : cls;
}

function translateClassName(className: string): string {
  const classes = className.split(/\s+/).filter(Boolean);
  if (classes.length === 0) return '';
  const descriptions = classes.map(translateSingleClass);
  if (descriptions.length <= 3) {
    return descriptions.join(', ');
  }
  return descriptions.slice(0, -1).join(', ') + ', and ' + descriptions[descriptions.length - 1];
}

function translateStyleObject(styleText: string): string {
  const match = styleText.match(/^\{\s*(.+)\s*\}$/s);
  if (!match) return 'with inline styles';

  const content = match[1];
  const props = content.split(',').map(p => p.trim()).filter(Boolean);
  const descriptions: string[] = [];

  for (const prop of props) {
    const colonIdx = prop.indexOf(':');
    if (colonIdx === -1) continue;
    const key = prop.slice(0, colonIdx).trim();
    const value = prop.slice(colonIdx + 1).trim().replace(/['"]/g, '');
    const englishKey = key.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
    descriptions.push(`${englishKey}: ${value}`);
  }

  if (descriptions.length === 0) return 'with inline styles';
  return `with inline styles: ${descriptions.join(', ')}`;
}

function describeEventHandler(name: string, value: ts.JsxAttributeValue): string {
  const eventDesc = EVENT_DESCRIPTIONS[name] || name.replace(/^on/, 'when ').replace(/([A-Z])/g, ' $1').toLowerCase();

  if (!value) return eventDesc;

  if (ts.isStringLiteral(value)) {
    return `${eventDesc}, calls ${value.text}`;
  }

  if (ts.isJsxExpression(value) && value.expression) {
    const expr = value.expression;
    if (ts.isIdentifier(expr)) {
      return `${eventDesc}, calls ${expr.text}`;
    }
    if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) {
      const body = expr.body;
      if (ts.isCallExpression(body)) {
        return `${eventDesc}, calls ${body.expression.getText()}${body.arguments.length > 0 ? ' with ' + body.arguments.map(a => a.getText()).join(', ') : ''}`;
      }
      if (ts.isBlock(body) && body.statements.length === 1 && ts.isExpressionStatement(body.statements[0])) {
        const stmt = body.statements[0].expression;
        if (ts.isCallExpression(stmt)) {
          return `${eventDesc}, calls ${stmt.expression.getText()}${stmt.arguments.length > 0 ? ' with ' + stmt.arguments.map(a => a.getText()).join(', ') : ''}`;
        }
      }
      return `${eventDesc}, executes handler`;
    }
    if (ts.isPropertyAccessExpression(expr)) {
      return `${eventDesc}, calls ${expr.getText()}`;
    }
    return `${eventDesc}, executes handler`;
  }

  return eventDesc;
}

function getTagName(tagName: ts.JsxTagNameExpression): string {
  if (ts.isIdentifier(tagName)) {
    return tagName.text;
  }
  if (ts.isPropertyAccessExpression(tagName)) {
    return tagName.getText();
  }
  return tagName.getText();
}

function isComponentTag(tagName: string): boolean {
  return /^[A-Z]/.test(tagName);
}

function describeTag(tagName: string): string {
  if (isComponentTag(tagName)) {
    return `${tagName} component`;
  }
  return TAG_DESCRIPTIONS[tagName] || tagName;
}

interface AttributeResult {
  description: string;
  metadata: Record<string, any>;
}

function processAttributes(
  attrs: ts.JsxAttributes,
  _tagName: string
): AttributeResult {
  const descriptions: string[] = [];
  const metadata: Record<string, any> = {
    props: {},
    events: [],
    className: null,
    classNameDescription: null,
    style: null,
    styleDescription: null,
    href: null,
    src: null,
    alt: null,
    ariaLabel: null,
    role: null,
    testId: null,
  };

  for (const attr of attrs.properties) {
    if (ts.isJsxSpreadAttribute(attr)) {
      descriptions.push(`passes through all props from ${attr.expression.getText()}`);
      continue;
    }

    if (!ts.isJsxAttribute(attr)) continue;

    const name = attr.name.getText();
    const value = attr.initializer;

    if (name === 'key' || name === 'ref') continue;

    if (name === 'className' || name === 'class') {
      if (value && ts.isStringLiteral(value)) {
        metadata.className = value.text;
        metadata.classNameDescription = translateClassName(value.text);
        descriptions.push(metadata.classNameDescription);
      } else if (value && ts.isJsxExpression(value)) {
        descriptions.push('with dynamic styles');
        metadata.classNameDescription = 'dynamic styles';
      }
      continue;
    }

    if (name === 'style') {
      if (value && ts.isJsxExpression(value) && value.expression) {
        const styleText = value.expression.getText();
        metadata.style = styleText;
        metadata.styleDescription = translateStyleObject(styleText);
        descriptions.push(metadata.styleDescription);
      }
      continue;
    }

    if (name.startsWith('on') && name.length > 2 && /[A-Z]/.test(name[2])) {
      const eventDesc = describeEventHandler(name, value!);
      metadata.events.push({ name, description: eventDesc });
      descriptions.push(eventDesc);
      continue;
    }

    if (name === 'href') {
      if (value && ts.isStringLiteral(value)) {
        metadata.href = value.text;
        descriptions.push(`pointing to ${value.text}`);
      } else if (value && ts.isJsxExpression(value) && value.expression) {
        metadata.href = value.expression.getText();
        descriptions.push(`pointing to ${value.expression.getText()}`);
      }
      continue;
    }

    if (name === 'src') {
      if (value && ts.isStringLiteral(value)) {
        metadata.src = value.text;
        descriptions.push(`with source ${value.text}`);
      } else if (value && ts.isJsxExpression(value) && value.expression) {
        metadata.src = value.expression.getText();
        descriptions.push(`with source from ${value.expression.getText()}`);
      }
      continue;
    }

    if (name === 'alt') {
      if (value && ts.isStringLiteral(value)) {
        metadata.alt = value.text;
        descriptions.push(`described as "${value.text}"`);
      } else if (value && ts.isJsxExpression(value) && value.expression) {
        metadata.alt = value.expression.getText();
        descriptions.push(`described by ${value.expression.getText()}`);
      }
      continue;
    }

    if (name === 'aria-label') {
      if (value && ts.isStringLiteral(value)) {
        metadata.ariaLabel = value.text;
        descriptions.push(`accessible label "${value.text}"`);
      }
      continue;
    }

    if (name === 'role') {
      if (value && ts.isStringLiteral(value)) {
        metadata.role = value.text;
        descriptions.push(`role: ${value.text}`);
      }
      continue;
    }

    if (name === 'data-testid') {
      if (value && ts.isStringLiteral(value)) {
        metadata.testId = value.text;
      }
      continue;
    }

    if (name === 'disabled') {
      if (!value || (ts.isJsxExpression(value) && value.expression && value.expression.getText() !== 'false')) {
        descriptions.push('disabled');
      }
      continue;
    }

    if (name === 'readOnly') {
      descriptions.push('read-only');
      continue;
    }

    if (name === 'required') {
      descriptions.push('required');
      continue;
    }

    if (name === 'placeholder') {
      if (value && ts.isStringLiteral(value)) {
        descriptions.push(`placeholder "${value.text}"`);
      } else if (value && ts.isJsxExpression(value) && value.expression) {
        descriptions.push(`placeholder from ${value.expression.getText()}`);
      }
      continue;
    }

    if (name === 'type') {
      if (value && ts.isStringLiteral(value)) {
        metadata.props[name] = value.text;
        continue;
      }
    }

    if (name === 'id' || name === 'name' || name === 'htmlFor') {
      if (value && ts.isStringLiteral(value)) {
        metadata.props[name] = value.text;
        continue;
      }
    }

    if (value) {
      if (ts.isStringLiteral(value)) {
        metadata.props[name] = value.text;
        descriptions.push(`${name}: "${value.text}"`);
      } else if (ts.isJsxExpression(value) && value.expression) {
        metadata.props[name] = value.expression.getText();
        descriptions.push(`${name} from ${value.expression.getText()}`);
      }
    } else {
      metadata.props[name] = true;
      descriptions.push(name);
    }
  }

  return {
    description: descriptions.length > 0 ? descriptions.join(', ') : '',
    metadata,
  };
}

function unwrapExpression(expr: ts.Expression): ts.Expression {
  if (ts.isParenthesizedExpression(expr)) {
    return unwrapExpression(expr.expression);
  }
  if (ts.isAsExpression(expr)) {
    return unwrapExpression(expr.expression);
  }
  return expr;
}

function processMapCall(call: ts.CallExpression, indent: number, sourceFile: ts.SourceFile): SemanticNode | null {
  const expr = call.expression;
  if (!ts.isPropertyAccessExpression(expr)) return null;
  if (expr.name.text !== 'map') return null;

  const collection = expr.expression.getText();
  const callback = call.arguments[0];
  if (!callback) return null;

  let itemName = 'item';
  let indexName = '';
  let bodyExpr: ts.Expression | null = null;

  if (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) {
    if (callback.parameters.length > 0) {
      itemName = callback.parameters[0].name.getText();
    }
    if (callback.parameters.length > 1) {
      indexName = callback.parameters[1].name.getText();
    }

    const body = callback.body;
    if (ts.isBlock(body)) {
      const returnStmt = body.statements.find(ts.isReturnStatement);
      if (returnStmt && returnStmt.expression) {
        bodyExpr = unwrapExpression(returnStmt.expression);
      }
    } else {
      bodyExpr = unwrapExpression(body);
    }
  }

  const children: SemanticNode[] = [];
  if (bodyExpr && isJsxNode(bodyExpr)) {
    const child = processJsxNode(bodyExpr, indent + 1, sourceFile);
    if (child) children.push(child);
  }

  const lines = getNodeLineRange(call, sourceFile);
  return {
    type: 'jsx-list',
    name: collection,
    children,
    metadata: {
      collection,
      itemName,
      indexName,
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end,
  };
}

function processFilterCall(call: ts.CallExpression, indent: number, sourceFile: ts.SourceFile): SemanticNode | null {
  const expr = call.expression;
  if (!ts.isPropertyAccessExpression(expr)) return null;
  if (expr.name.text !== 'filter') return null;

  const collection = expr.expression.getText();
  const callback = call.arguments[0];
  let condition = '';

  if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
    condition = callback.body.getText();
  }

  const lines = getNodeLineRange(call, sourceFile);
  return {
    type: 'jsx-filter',
    name: collection,
    children: [],
    metadata: {
      collection,
      condition,
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end,
  };
}

function processConditionalAnd(expr: ts.BinaryExpression, indent: number, sourceFile: ts.SourceFile): SemanticNode | null {
  if (expr.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken) return null;

  const condition = expr.left.getText();
  const children: SemanticNode[] = [];

  const right = unwrapExpression(expr.right);
  if (isJsxNode(right)) {
    const child = processJsxNode(right, indent + 1, sourceFile);
    if (child) children.push(child);
  }

  const lines = getNodeLineRange(expr, sourceFile);
  return {
    type: 'jsx-conditional',
    children,
    metadata: {
      condition,
      variant: 'and',
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end,
  };
}

function processTernary(expr: ts.ConditionalExpression, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const condition = expr.condition.getText();
  const trueChildren: SemanticNode[] = [];
  const falseChildren: SemanticNode[] = [];

  const trueExpr = unwrapExpression(expr.whenTrue);
  const falseExpr = unwrapExpression(expr.whenFalse);

  if (isJsxNode(trueExpr)) {
    const child = processJsxNode(trueExpr, indent + 1, sourceFile);
    if (child) trueChildren.push(child);
  } else if (ts.isStringLiteral(trueExpr)) {
    trueChildren.push({
      type: 'jsx-text',
      children: [],
      metadata: { text: trueExpr.text },
      indent: indent + 1,
      sourceStartLine: 0,
      sourceEndLine: 0,
    });
  } else if (trueExpr.kind !== ts.SyntaxKind.NullKeyword && trueExpr.getText() !== 'null' && trueExpr.getText() !== 'undefined') {
    trueChildren.push({
      type: 'jsx-expression',
      children: [],
      metadata: { expression: trueExpr.getText() },
      indent: indent + 1,
      sourceStartLine: 0,
      sourceEndLine: 0,
    });
  }

  if (isJsxNode(falseExpr)) {
    const child = processJsxNode(falseExpr, indent + 1, sourceFile);
    if (child) falseChildren.push(child);
  } else if (ts.isStringLiteral(falseExpr)) {
    falseChildren.push({
      type: 'jsx-text',
      children: [],
      metadata: { text: falseExpr.text },
      indent: indent + 1,
      sourceStartLine: 0,
      sourceEndLine: 0,
    });
  } else if (falseExpr.kind !== ts.SyntaxKind.NullKeyword && falseExpr.getText() !== 'null' && falseExpr.getText() !== 'undefined') {
    falseChildren.push({
      type: 'jsx-expression',
      children: [],
      metadata: { expression: falseExpr.getText() },
      indent: indent + 1,
      sourceStartLine: 0,
      sourceEndLine: 0,
    });
  }

  const lines = getNodeLineRange(expr, sourceFile);
  return {
    type: 'jsx-conditional',
    children: [...trueChildren, ...falseChildren.map(c => ({ ...c, type: 'jsx-conditional-alt' as string }))],
    metadata: {
      condition,
      variant: 'ternary',
      hasAlternate: falseChildren.length > 0,
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end,
  };
}

function processJsxExpression(node: ts.JsxExpression, indent: number, sourceFile: ts.SourceFile): SemanticNode | null {
  if (!node.expression) return null;

  const expr = unwrapExpression(node.expression);

  if (ts.isCallExpression(expr)) {
    const propAccess = expr.expression;
    if (ts.isPropertyAccessExpression(propAccess)) {
      if (propAccess.name.text === 'map') {
        return processMapCall(expr, indent, sourceFile);
      }
      if (propAccess.name.text === 'filter') {
        const filterNode = processFilterCall(expr, indent, sourceFile);
        if (filterNode) return filterNode;
      }
    }
    const lines = getNodeLineRange(node, sourceFile);
    return {
      type: 'jsx-expression',
      children: [],
      metadata: { expression: expr.getText() },
      indent,
      sourceStartLine: lines.start,
      sourceEndLine: lines.end,
    };
  }

  if (ts.isBinaryExpression(expr)) {
    const conditional = processConditionalAnd(expr, indent, sourceFile);
    if (conditional) return conditional;
  }

  if (ts.isConditionalExpression(expr)) {
    return processTernary(expr, indent, sourceFile);
  }

  if (ts.isStringLiteral(expr) || ts.isNumericLiteral(expr)) {
    const lines = getNodeLineRange(node, sourceFile);
    return {
      type: 'jsx-text',
      children: [],
      metadata: { text: expr.text },
      indent,
      sourceStartLine: lines.start,
      sourceEndLine: lines.end,
    };
  }

  if (ts.isTemplateExpression(expr)) {
    const lines = getNodeLineRange(node, sourceFile);
    return {
      type: 'jsx-expression',
      children: [],
      metadata: { expression: expr.getText(), isTemplate: true },
      indent,
      sourceStartLine: lines.start,
      sourceEndLine: lines.end,
    };
  }

  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'jsx-expression',
    children: [],
    metadata: { expression: expr.getText() },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end,
  };
}

function processJsxText(node: ts.JsxText, indent: number, sourceFile: ts.SourceFile): SemanticNode | null {
  const text = node.text.replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'jsx-text',
    children: [],
    metadata: { text },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end,
  };
}

function processChildren(children: readonly ts.JsxChild[], indent: number, sourceFile: ts.SourceFile): SemanticNode[] {
  const result: SemanticNode[] = [];

  for (const child of children) {
    if (ts.isJsxText(child)) {
      const node = processJsxText(child, indent, sourceFile);
      if (node) result.push(node);
    } else if (ts.isJsxElement(child)) {
      result.push(processElement(child, indent, sourceFile));
    } else if (ts.isJsxSelfClosingElement(child)) {
      result.push(processSelfClosing(child, indent, sourceFile));
    } else if (ts.isJsxExpression(child)) {
      const node = processJsxExpression(child, indent, sourceFile);
      if (node) result.push(node);
    } else if (ts.isJsxFragment(child)) {
      result.push(processFragment(child, indent, sourceFile));
    }
  }

  return result;
}

function processElement(node: ts.JsxElement, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const tagName = getTagName(node.openingElement.tagName);
  const tagDesc = describeTag(tagName);
  const isComp = isComponentTag(tagName);
  const { description: attrDesc, metadata: attrMeta } = processAttributes(node.openingElement.attributes, tagName);
  const children = processChildren(node.children, indent + 1, sourceFile);

  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'jsx-element',
    name: tagName,
    children,
    metadata: {
      isComponent: isComp,
      tagDescription: tagDesc,
      attributeDescription: attrDesc,
      ...attrMeta,
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end,
  };
}

function processSelfClosing(node: ts.JsxSelfClosingElement, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const tagName = getTagName(node.tagName);
  const tagDesc = describeTag(tagName);
  const isComp = isComponentTag(tagName);
  const { description: attrDesc, metadata: attrMeta } = processAttributes(node.attributes, tagName);

  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'jsx-element',
    name: tagName,
    children: [],
    metadata: {
      isComponent: isComp,
      tagDescription: tagDesc,
      attributeDescription: attrDesc,
      selfClosing: true,
      ...attrMeta,
    },
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end,
  };
}

function processFragment(node: ts.JsxFragment, indent: number, sourceFile: ts.SourceFile): SemanticNode {
  const children = processChildren(node.children, indent + 1, sourceFile);
  const lines = getNodeLineRange(node, sourceFile);
  return {
    type: 'jsx-fragment',
    children,
    metadata: {},
    indent,
    sourceStartLine: lines.start,
    sourceEndLine: lines.end,
  };
}

export function isJsxNode(node: ts.Node): boolean {
  return ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node);
}

export function processJsxNode(node: ts.Node, indent: number, sourceFile: ts.SourceFile): SemanticNode | null {
  if (ts.isJsxElement(node)) return processElement(node, indent, sourceFile);
  if (ts.isJsxSelfClosingElement(node)) return processSelfClosing(node, indent, sourceFile);
  if (ts.isJsxFragment(node)) return processFragment(node, indent, sourceFile);
  return null;
}

export function getJsxFromExpression(expr: ts.Expression | undefined): ts.Node | null {
  if (!expr) return null;
  const unwrapped = unwrapExpression(expr);
  if (isJsxNode(unwrapped)) return unwrapped;
  return null;
}

type Translator = (node: SemanticNode) => string;

export const jsxTranslations: Record<string, Translator> = {
  'jsx-element': (node) => {
    const desc = node.metadata.tagDescription;
    const attrDesc = node.metadata.attributeDescription;
    const prefix = node.metadata.isComponent ? `Render ${desc}` : `Render a ${desc}`;
    return attrDesc ? `${prefix}, ${attrDesc}` : prefix;
  },

  'jsx-fragment': () => {
    return 'Render a group of elements';
  },

  'jsx-list': (node) => {
    const collection = node.metadata.collection;
    const itemName = node.metadata.itemName;
    return `For each ${itemName} in ${collection}, render:`;
  },

  'jsx-filter': (node) => {
    const collection = node.metadata.collection;
    const condition = node.metadata.condition;
    return `Filter ${collection} where ${condition}, then render:`;
  },

  'jsx-conditional': (node) => {
    const condition = node.metadata.condition;
    if (node.metadata.variant === 'ternary') {
      return `If ${condition}, show:`;
    }
    return `When ${condition}, show:`;
  },

  'jsx-conditional-alt': () => {
    return 'Otherwise, show:';
  },

  'jsx-text': (node) => {
    const text = node.metadata.text;
    if (text.length > 60) {
      return `Show text: "${text.slice(0, 57)}..."`;
    }
    return `Show text: "${text}"`;
  },

  'jsx-expression': (node) => {
    if (node.metadata.isTemplate) {
      return `Show dynamic text: ${node.metadata.expression}`;
    }
    return `Show: ${node.metadata.expression}`;
  },
};
