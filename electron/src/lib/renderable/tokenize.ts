import type { SemanticNode } from '../makeSemanticGraph';
import type { InlineToken, NodeRenderable } from './types';
import { bucketForType } from './bucket';
import { buildHover } from './hoverContent';
import { jsxSubTokens } from './jsxTokens';

function pad(n: number): InlineToken {
  return { text: '  '.repeat(n), variant: 'punct' };
}

function base(node: SemanticNode): Omit<NodeRenderable, 'tokens'> {
  let bucket = bucketForType(node.type);
  if (node.type === 'return' && node.metadata.hasJsx) {
    bucket = 'jsx';
  }
  return {
    bucket,
    indent: node.indent,
    sourceStartLine: node.sourceStartLine,
    sourceEndLine: node.sourceEndLine,
  };
}

function importTokens(node: SemanticNode): InlineToken[] {
  const names = String(node.name ?? '');
  const module = String(node.metadata.module ?? '');
  const verb = names.includes(',') ? 'are imported from' : 'is imported from';
  return [
    pad(node.indent),
    { text: 'import ', variant: 'kw' },
    { text: names, variant: 'ident' },
    { text: ` ${verb} `, variant: 'ident' },
    {
      text: module,
      variant: 'string',
      hover: buildHover('Module', module),
    },
  ];
}

function exportTokens(node: SemanticNode): InlineToken[] {
  const names = String(node.name ?? '');
  const module = String(node.metadata.module ?? '');
  const verb = names.includes(',') ? 'are' : 'is';
  if (module) {
    return [
      pad(node.indent),
      { text: 'export ', variant: 'kw' },
      { text: names, variant: 'ident' },
      { text: ` ${verb} re-exported from `, variant: 'ident' },
      {
        text: module,
        variant: 'string',
        hover: buildHover('Module', module),
      },
    ];
  }
  return [
    pad(node.indent),
    { text: 'export ', variant: 'kw' },
    { text: names, variant: 'ident' },
    { text: ` ${verb} exported`, variant: 'ident' },
  ];
}

function functionTokens(node: SemanticNode): InlineToken[] {
  const params = (node.metadata.parameters as string[]) ?? [];
  const paramText = params.length > 0 ? `Parameters: ${params.join(', ')}` : 'No parameters';
  return [
    pad(node.indent),
    { text: `Define function `, variant: 'kw' },
    { text: node.name ?? 'anonymous', variant: 'fn-name' },
    { text: `. ${paramText}`, variant: 'ident' },
  ];
}

function methodTokens(node: SemanticNode): InlineToken[] {
  const params = (node.metadata.parameters as string[]) ?? [];
  const paramText = params.length > 0 ? `Parameters: ${params.join(', ')}` : 'No parameters';
  return [
    pad(node.indent),
    { text: `Define method `, variant: 'kw' },
    { text: node.name ?? 'anonymous', variant: 'fn-name' },
    { text: `. ${paramText}`, variant: 'ident' },
  ];
}

function classTokens(node: SemanticNode): InlineToken[] {
  const extendsText = node.metadata.extends ? ` (extends ${node.metadata.extends})` : '';
  return [
    pad(node.indent),
    { text: `Define class `, variant: 'kw' },
    { text: node.name ?? 'anonymous', variant: 'fn-name' },
    { text: extendsText, variant: 'ident' },
  ];
}

function interfaceTokens(node: SemanticNode): InlineToken[] {
  return [
    pad(node.indent),
    { text: 'Define interface ', variant: 'kw' },
    { text: node.name ?? 'anonymous', variant: 'fn-name' },
  ];
}

function typeAliasTokens(node: SemanticNode): InlineToken[] {
  return [
    pad(node.indent),
    { text: 'Define type ', variant: 'kw' },
    { text: node.name ?? 'anonymous', variant: 'fn-name' },
    { text: ' as ', variant: 'ident' },
    { text: String(node.metadata.type ?? ''), variant: 'ident' },
  ];
}

function propertyTokens(node: SemanticNode): InlineToken[] {
  const type = String(node.metadata.type ?? 'any');
  const init = node.metadata.initializer as string | null;
  const initText = init ? `, initialized to ${init}` : '';
  return [
    pad(node.indent),
    { text: '`', variant: 'punct' },
    { text: node.name ?? 'anonymous', variant: 'ident' },
    { text: '` is a ', variant: 'ident' },
    { text: type, variant: 'ident' },
    { text: initText, variant: 'ident' },
  ];
}

function variableTokens(node: SemanticNode): InlineToken[] {
  const init = node.metadata.initializer as string | null;
  const tokens: InlineToken[] = [
    pad(node.indent),
    { text: 'Declare variable ', variant: 'kw' },
    { text: '`', variant: 'punct' },
    { text: node.name ?? 'anonymous', variant: 'ident' },
    { text: '`', variant: 'punct' },
  ];
  if (init) {
    tokens.push({ text: ' = ', variant: 'ident' });
    tokens.push({ text: init, variant: 'ident' });
  }
  return tokens;
}

function returnTokens(node: SemanticNode): InlineToken[] {
  if (node.metadata.hasJsx) {
    return [pad(node.indent), { text: 'Render', variant: 'kw' }];
  }
  const value = node.metadata.value as string | null;
  if (value) {
    return [
      pad(node.indent),
      { text: 'return ', variant: 'kw' },
      { text: '`', variant: 'punct' },
      { text: value, variant: 'ident' },
      { text: '`', variant: 'punct' },
    ];
  }
  return [pad(node.indent), { text: 'return', variant: 'kw' }];
}

function ifTokens(node: SemanticNode): InlineToken[] {
  return [
    pad(node.indent),
    { text: `If ${node.metadata.condition}`, variant: 'kw' },
  ];
}

function loopTokens(node: SemanticNode): InlineToken[] {
  const t = node.metadata.loopType as string;
  if (t === 'forOf') return [pad(node.indent), { text: 'For each item', variant: 'kw' }];
  if (t === 'forIn') return [pad(node.indent), { text: 'For each key', variant: 'kw' }];
  return [pad(node.indent), { text: 'Loop', variant: 'kw' }];
}

function callTokens(node: SemanticNode): InlineToken[] {
  const fn = String(node.metadata.function ?? '');
  const args = (node.metadata.arguments as string[]) ?? [];
  if (args.length > 0) {
    return [
      pad(node.indent),
      { text: 'Call ', variant: 'kw' },
      { text: fn, variant: 'fn-name' },
      { text: ' with ', variant: 'ident' },
      { text: args.join(', '), variant: 'ident' },
    ];
  }
  return [
    pad(node.indent),
    { text: 'Call ', variant: 'kw' },
    { text: fn, variant: 'fn-name' },
  ];
}

const JSX_TYPES = new Set([
  'jsx-element',
  'jsx-fragment',
  'jsx-list',
  'jsx-filter',
  'jsx-conditional',
  'jsx-conditional-alt',
  'jsx-text',
  'jsx-expression',
]);

export function tokenize(node: SemanticNode): NodeRenderable {
  let tokens: InlineToken[];
  switch (node.type) {
    case 'import':       tokens = importTokens(node); break;
    case 'export':       tokens = exportTokens(node); break;
    case 'function':     tokens = functionTokens(node); break;
    case 'method':       tokens = methodTokens(node); break;
    case 'class':        tokens = classTokens(node); break;
    case 'interface':    tokens = interfaceTokens(node); break;
    case 'typeAlias':    tokens = typeAliasTokens(node); break;
    case 'property':     tokens = propertyTokens(node); break;
    case 'variable':     tokens = variableTokens(node); break;
    case 'return':       tokens = returnTokens(node); break;
    case 'if':           tokens = ifTokens(node); break;
    case 'loop':         tokens = loopTokens(node); break;
    case 'call':         tokens = callTokens(node); break;
    default:
      if (JSX_TYPES.has(node.type)) {
        tokens = jsxSubTokens(node);
      } else {
        tokens = [{ text: `[${node.type}]`, variant: 'ident' }];
      }
  }
  return { ...base(node), tokens };
}
