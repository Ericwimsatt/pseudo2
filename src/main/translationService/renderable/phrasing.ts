import type { SemanticNode } from '../makeSemanticGraph';
import type { DisplayNodeData, DisplaySpan, HoverContent } from './types';
import { buildHover, getKeywordTooltip, getReactHookTooltip } from './hover';
import { translateType } from './translateType';

type Phraser = (node: SemanticNode) => DisplaySpan[];

function span(text: string, hover?: HoverContent, refPos?: number): DisplaySpan {
  const result: DisplaySpan = { text };
  if (hover) result.hover = hover;
  if (refPos !== undefined) {
    result.refPos = refPos;
    result.hasHover = true;
  }
  return result;
}

function exportedPrefix(node: SemanticNode): DisplaySpan[] {
  if (!node.metadata.exported) return [];
  const tooltip = getKeywordTooltip('export');
  return [span('Export: ', tooltip ?? undefined)];
}

function phraseImport(node: SemanticNode): DisplaySpan[] {
  const names = String(node.name ?? '');
  const module = String(node.metadata.module ?? '');
  return [
    span('import {'),
    span(names, undefined, node.refPos),
    span(`} from `),
    span(module, buildHover('Module', module)),
  ];
}

function phraseExport(node: SemanticNode): DisplaySpan[] {
  const names = String(node.name ?? '');
  const module = String(node.metadata.module ?? '');
  const verb = names.includes(',') ? 'are' : 'is';
  const exportTooltip = getKeywordTooltip('export');
  const spans = [span('export ', exportTooltip ?? undefined), span(names, undefined, node.refPos)];
  if (module) {
    spans.push(span(` ${verb} re-exported from `), span(module, buildHover('Module', module)));
  } else {
    spans.push(span(` ${verb} exported`));
  }
  return spans;
}

function phraseFunction(node: SemanticNode): DisplaySpan[] {
  const params = (node.metadata.parameters as string[]) ?? [];
  const paramText = `Parameters: ${params.join(', ')}`;
  return [
    ...exportedPrefix(node),
    span(`Function `),
    span(node.name ?? 'anonymous', undefined, node.refPos),
    span(`. ${paramText}`),
  ];
}

function phraseClass(node: SemanticNode): DisplaySpan[] {
  const spans = [...exportedPrefix(node), span('Class '), span(node.name ?? 'anonymous', undefined, node.refPos)];
  if (node.metadata.extends) {
    spans.push(span(` (extends ${node.metadata.extends})`));
  }
  return spans;
}

function phraseInterface(node: SemanticNode): DisplaySpan[] {
  return [...exportedPrefix(node), span('Interface '), span(node.name ?? 'anonymous', undefined, node.refPos)];
}

function phraseTypeAlias(node: SemanticNode): DisplaySpan[] {
  return [
    ...exportedPrefix(node),
    span('Type '),
    span(node.name ?? 'anonymous', undefined, node.refPos),
    span(' as '),
    span(String(node.metadata.type ?? '')),
  ];
}

function phraseProperty(node: SemanticNode): DisplaySpan[] {
  const type = String(node.metadata.type ?? 'any');
  const init = node.metadata.initializer as string | null;
  const spans: DisplaySpan[] = [];
  spans.push(
    span('`'),
    span(node.name ?? 'anonymous', undefined, node.refPos),
    span('` is '),
    span(translateType(type)),
  );
  if (init) spans.push(span(`, initialized to ${init}`));
  return spans;
}

function phraseVariable(node: SemanticNode): DisplaySpan[] {
  const init = node.metadata.initializer as string | null;
  const spans = [
    ...exportedPrefix(node),
    span('Declare variable '),
    span('`'),
    span(node.name ?? 'anonymous', undefined, node.refPos),
    span('`'),
  ];
  if (init) spans.push(span(' = '), span(init));
  return spans;
}

function phraseReturn(node: SemanticNode): DisplaySpan[] {
  if (node.metadata.hasJsx) return [span('Return Visual Elements:')];
  const value = node.metadata.value as string | null;
  if (value) {
    return [span('return '), span('`'), span(value), span('`')];
  }
  return [span('return')];
}

function phraseIf(node: SemanticNode): DisplaySpan[] {
  return [span(`If ${node.metadata.condition}`)];
}

function phraseOtherwiseIf(node: SemanticNode): DisplaySpan[] {
  return [span(`otherwise if ${node.metadata.condition}`)];
}

function phraseOtherwise(): DisplaySpan[] {
  return [span('otherwise')];
}

function phraseLoop(node: SemanticNode): DisplaySpan[] {
  const t = node.metadata.loopType as string;
  const text = t === 'forOf' ? 'For each item' : t === 'forIn' ? 'For each key' : 'Loop';
  return [span(text)];
}

function phraseCall(node: SemanticNode): DisplaySpan[] {
  const fn = String(node.metadata.function ?? '');
  const allArgs = (node.metadata.arguments as string[]) ?? [];
  const displayArgs = allArgs.filter((a) => a !== '<function>');
  const fnCount = allArgs.length - displayArgs.length;
  const verb = node.metadata.isNew ? 'Instantiate' : 'Call';

  const parts: string[] = [];
  if (displayArgs.length > 0) parts.push(displayArgs.join(', '));
  if (fnCount > 0) parts.push(`${fnCount} function${fnCount > 1 ? 's' : ''}`);
  const argPart = parts.length > 0 ? ` with ${parts.join(' and ')}` : '';

  const spans = [
    span(`${verb} `),
    span(fn, getReactHookTooltip(fn) ?? undefined, node.refPos),
  ];
  if (argPart) spans.push(span(argPart));
  return spans;
}

interface EventItem {
  name: string;
  description: string;
}

function phraseJsxAttrs(node: SemanticNode): DisplaySpan[] {
  const meta = node.metadata;
  const spans: DisplaySpan[] = [];

  if (meta.className) {
    spans.push(
      span(' className='),
      span(
        `"${meta.className}"`,
        buildHover('className', String(meta.classNameDescription ?? ''), { classes: meta.className }),
      ),
    );
  } else if (meta.classNameDescription) {
    spans.push(
      span(' className='),
      span(
        `"${meta.classNameDescription}"`,
        buildHover('className', String(meta.classNameDescription)),
      ),
    );
  }

  if (meta.props && typeof meta.props === 'object') {
    for (const [name, value] of Object.entries(meta.props as Record<string, unknown>)) {
      if (value === true) {
        spans.push(span(` ${name}`));
      } else {
        spans.push(span(` ${name}`), span('='), span(`"${value}"`));
      }
    }
  }

  if (Array.isArray(meta.events)) {
    for (const ev of meta.events as EventItem[]) {
      spans.push(span(` ${ev.name}`), span('='), span('{...}'));
    }
  }

  if (meta.href) {
    spans.push(
      span(' href='),
      span(`"${meta.href}"`, buildHover('href', String(meta.href))),
    );
  }

  if (meta.src) {
    spans.push(
      span(' src='),
      span(`"${meta.src}"`, buildHover('src', String(meta.src))),
    );
  }

  if (meta.alt) {
    spans.push(span(' alt='), span(`"${meta.alt}"`));
  }

  return spans;
}

function phraseJsxElement(node: SemanticNode): DisplaySpan[] {
  const name = node.name!;
  const spans = [
    span('<'),
    span(name, buildHover(name, String(node.metadata.tagDescription ?? ''))),
    ...phraseJsxAttrs(node),
  ];
  if (node.metadata.selfClosing) {
    spans.push(span(' '), span('/>'));
  } else {
    spans.push(span('>'));
  }
  return spans;
}

function phraseJsxFragment(): DisplaySpan[] {
  return [span('<>'), span('…'), span('</>')];
}

function phraseJsxList(node: SemanticNode): DisplaySpan[] {
  return [span(`For each ${node.metadata.itemName} in ${node.metadata.collection}:`)];
}

function phraseJsxFilter(node: SemanticNode): DisplaySpan[] {
  return [span(`Filter ${node.metadata.collection} where ${node.metadata.condition}:`)];
}

function phraseJsxConditional(node: SemanticNode): DisplaySpan[] {
  if (node.type === 'jsx-conditional-alt') return [span('Otherwise, show:')];
  const text =
    node.metadata.variant === 'ternary'
      ? `If ${node.metadata.condition}, show:`
      : `When ${node.metadata.condition}, show:`;
  return [span(text)];
}

function phraseJsxText(node: SemanticNode): DisplaySpan[] {
  const text = String(node.metadata.text);
  const display = text.length > 60 ? `${text.slice(0, 57)}...` : text;
  return [span(`Show text: "${display}"`)];
}

function phraseJsxExpression(node: SemanticNode): DisplaySpan[] {
  if (node.metadata.isTemplate) {
    return [span(`Show dynamic text: ${node.metadata.expression}`)];
  }
  return [span(`Show: ${node.metadata.expression}`)];
}

function phraseFallback(node: SemanticNode): DisplaySpan[] {
  return [span(`[${node.type}]`)];
}

const PHRASERS: Record<string, Phraser> = {
  import: phraseImport,
  export: phraseExport,
  function: phraseFunction,
  method: phraseFunction,
  class: phraseClass,
  interface: phraseInterface,
  typeAlias: phraseTypeAlias,
  property: phraseProperty,
  variable: phraseVariable,
  return: phraseReturn,
  if: phraseIf,
  loop: phraseLoop,
  call: phraseCall,
  'jsx-element': phraseJsxElement,
  'jsx-fragment': phraseJsxFragment,
  'jsx-list': phraseJsxList,
  'jsx-filter': phraseJsxFilter,
  'jsx-conditional': phraseJsxConditional,
  'jsx-conditional-alt': phraseJsxConditional,
  'jsx-text': phraseJsxText,
  'jsx-expression': phraseJsxExpression,
  'otherwise-if': phraseOtherwiseIf,
  otherwise: phraseOtherwise,
};

export function toDisplayNode(node: SemanticNode): DisplayNodeData {
  const phrase = PHRASERS[node.type] ?? phraseFallback;
  return { indent: node.indent, spans: phrase(node) };
}
