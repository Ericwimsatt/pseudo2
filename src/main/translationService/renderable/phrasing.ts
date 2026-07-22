import type { SemanticNode } from '../makeSemanticGraph';
import type { DisplayNodeData, DisplaySpan, HoverContent } from './types';
import { bucketForNode } from './bucket';
import { buildHover, getKeywordTooltip, getReactHookTooltip } from './hover';
import { translateType } from './translateType';
import phrasingRules from '../../../../config/phrasing-rules.json';

interface PhrasingRule {
  type: string;
  template: string;
}

let RULES: PhrasingRule[] = phrasingRules;

export function loadPhrasingRules(rules: PhrasingRule[]) {
  RULES = rules;
}

function t(type: string, vars: Record<string, string | undefined>): string {
  const rule = RULES.find(r => r.type === type);
  if (!rule) return `[${type}]`;
  return rule.template.replace(/\{(\w+)\}/g, (_, key) => {
    if (key in vars) return String(vars[key]);
    return `{${key}}`;
  });
}

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
  const text = t('import', { names, module });
  return [span(text)];
}

function phraseExport(node: SemanticNode): DisplaySpan[] {
  const names = String(node.name ?? '');
  const module = String(node.metadata.module ?? '');
  const verb = names.includes(',') ? 'are' : 'is';
  if (module) {
    return [span(t('export-re-export', { names, verb, module }))];
  }
  return [span(t('export', { names, verb }))];
}

function phraseFunctionDefinition(node: SemanticNode): DisplaySpan[] {
  const params = (node.metadata.parameters as string[]) ?? [];
  if (params.length > 0) {
    const text = t('function-definition', {
      name: node.name ?? 'anonymous',
      params: params.join(', '),
    });
    return [...exportedPrefix(node), span(text, undefined, node.refPos)];
  }
  if (node.name) {
    const text = t('function-definition-no-params', { name: node.name });
    return [...exportedPrefix(node), span(text, undefined, node.refPos)];
  }
  return [...exportedPrefix(node), span(t('function-definition-anonymous', {}))];
}

function phraseClass(node: SemanticNode): DisplaySpan[] {
  const name = node.name ?? 'anonymous';
  if (node.metadata.extends) {
    return [...exportedPrefix(node), span(t('class-extended', { name, extends: String(node.metadata.extends) }), undefined, node.refPos)];
  }
  return [...exportedPrefix(node), span(t('class', { name }), undefined, node.refPos)];
}

function phraseInterface(node: SemanticNode): DisplaySpan[] {
  return [...exportedPrefix(node), span(t('interface', { name: node.name ?? 'anonymous' }), undefined, node.refPos)];
}

function phraseTypeAlias(node: SemanticNode): DisplaySpan[] {
  return [...exportedPrefix(node), span(t('type-alias', { name: node.name ?? 'anonymous', type: String(node.metadata.type ?? '') }), undefined, node.refPos)];
}

function phraseProperty(node: SemanticNode): DisplaySpan[] {
  const name = node.name ?? 'anonymous';
  const type = String(node.metadata.type ?? 'any');
  const init = node.metadata.initializer as string | null;
  if (init) {
    return [span(t('property-with-init', { name, type: translateType(type), initializer: init }), undefined, node.refPos)];
  }
  return [span(t('property', { name, type: translateType(type) }), undefined, node.refPos)];
}

function phraseVariableAssignment(node: SemanticNode): DisplaySpan[] {
  const name = node.name ?? 'anonymous';
  const init = node.metadata.initializer as string | null;
  if (init) {
    return [...exportedPrefix(node), span(t('variable-assignment', { name, initializer: init }), undefined, node.refPos)];
  }
  if (node.children && node.children.length > 0) {
    return [...exportedPrefix(node), span(t('variable-assignment-target', { name }), undefined, node.refPos)];
  }
  return [...exportedPrefix(node), span(`\`${name}\``, undefined, node.refPos)];
}

function phraseReturn(node: SemanticNode): DisplaySpan[] {
  if (node.metadata.hasJsx) return [span(t('return-jsx', {}))];
  const value = node.metadata.value as string | null;
  if (value) return [span(t('return-value', { value }))];
  return [span(t('return', {}))];
}

function phraseIf(node: SemanticNode): DisplaySpan[] {
  return [span(t('if', { condition: String(node.metadata.condition) }))];
}

function phraseOtherwiseIf(node: SemanticNode): DisplaySpan[] {
  return [span(t('otherwise-if', { condition: String(node.metadata.condition) }))];
}

function phraseOtherwise(): DisplaySpan[] {
  return [span(t('otherwise', {}))];
}

function phraseLoop(node: SemanticNode): DisplaySpan[] {
  const loopType = node.metadata.loopType as string;
  if (loopType === 'forOf') return [span(t('loop-for-of', {}))];
  if (loopType === 'forIn') return [span(t('loop-for-in', { collection: String(node.metadata.collection ?? '') }))];
  return [span(t('loop', {}))];
}

function phraseCallFunction(node: SemanticNode): DisplaySpan[] {
  const fn = String(node.metadata.function ?? '');
  const tooltip = getReactHookTooltip(fn) ?? undefined;
  if (node.metadata.isNew) {
    return [span(t('instantiate', { function: fn }), tooltip, node.refPos)];
  }
  return [span(t('call-function', { function: fn }), tooltip, node.refPos)];
}

interface EventItem {
  name: string;
  description: string;
  handlerName?: string;
  handlerRefPos?: number;
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
      spans.push(span(` ${ev.name}`), span('='));
      if (ev.handlerName && ev.handlerRefPos !== undefined) {
        spans.push(span(`{${ev.handlerName}}`, undefined, ev.handlerRefPos));
      } else {
        spans.push(span('{...}'));
      }
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
    span(name, buildHover(name, String(node.metadata.tagDescription ?? '')), node.refPos),
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
  return [span(t('jsx-fragment', {}))];
}

function phraseJsxList(node: SemanticNode): DisplaySpan[] {
  return [span(t('jsx-list', { itemName: String(node.metadata.itemName), collection: String(node.metadata.collection) }))];
}

function phraseJsxFilter(node: SemanticNode): DisplaySpan[] {
  return [span(t('jsx-filter', { collection: String(node.metadata.collection), condition: String(node.metadata.condition) }))];
}

function phraseJsxConditional(node: SemanticNode): DisplaySpan[] {
  if (node.type === 'jsx-conditional-alt') return [span(t('jsx-conditional-alt', {}))];
  if (node.metadata.variant === 'ternary') return [span(t('jsx-conditional-ternary', { condition: String(node.metadata.condition) }))];
  return [span(t('jsx-conditional', { condition: String(node.metadata.condition) }))];
}

function phraseJsxText(node: SemanticNode): DisplaySpan[] {
  return [span(t('jsx-text', { text: String(node.metadata.text) }))];
}

function phraseJsxExpression(node: SemanticNode): DisplaySpan[] {
  const expr = String(node.metadata.expression);
  if (node.metadata.isTemplate) return [span(t('jsx-expression-template', { expression: expr }))];
  if (node.metadata.isSimpleIdentifier && node.refPos !== undefined) {
    return [span(t('jsx-expression-identifier', { expression: expr }), undefined, node.refPos)];
  }
  return [span(t('jsx-expression', { expression: expr }))];
}

function phraseObjectLiteral(): DisplaySpan[] {
  return [span(t('object-literal', {}))];
}

function phraseObjectProperty(node: SemanticNode): DisplaySpan[] {
  const name = node.name ?? '';
  if (node.metadata.isSpread) return [span(t('object-property-spread', { name }))];
  if (node.metadata.isMethod) return [span(t('object-property-method', { name }))];
  const value = node.metadata.value as string;
  if (value) return [span(t('object-property', { name, value }))];
  return [span(t('object-property', { name, value: '' }))];
}

function phraseObjectLiteralClose(): DisplaySpan[] {
  return [span(t('object-literal-close', {}))];
}

function phraseFallback(node: SemanticNode): DisplaySpan[] {
  return [span(`[${node.type}]`)];
}

const PHRASERS: Record<string, Phraser> = {
  import: phraseImport,
  export: phraseExport,
  'export-re-export': phraseExport,
  'function-definition': phraseFunctionDefinition,
  'function-definition-no-params': phraseFunctionDefinition,
  'function-definition-anonymous': phraseFunctionDefinition,
  class: phraseClass,
  'class-extended': phraseClass,
  interface: phraseInterface,
  typeAlias: phraseTypeAlias,
  'type-alias': phraseTypeAlias,
  property: phraseProperty,
  'property-with-init': phraseProperty,
  'variable-assignment': phraseVariableAssignment,
  'variable-assignment-target': phraseVariableAssignment,
  return: phraseReturn,
  'return-jsx': phraseReturn,
  'return-value': phraseReturn,
  if: phraseIf,
  loop: phraseLoop,
  'loop-for-of': phraseLoop,
  'loop-for-in': phraseLoop,
  'call-function': phraseCallFunction,
  instantiate: phraseCallFunction,
  'jsx-element': phraseJsxElement,
  'jsx-self-closing': phraseJsxElement,
  'jsx-fragment': phraseJsxFragment,
  'jsx-list': phraseJsxList,
  'jsx-filter': phraseJsxFilter,
  'jsx-conditional': phraseJsxConditional,
  'jsx-conditional-alt': phraseJsxConditional,
  'jsx-conditional-ternary': phraseJsxConditional,
  'jsx-text': phraseJsxText,
  'jsx-expression': phraseJsxExpression,
  'jsx-expression-identifier': phraseJsxExpression,
  'jsx-expression-template': phraseJsxExpression,
  'otherwise-if': phraseOtherwiseIf,
  otherwise: phraseOtherwise,
  'object-literal': phraseObjectLiteral,
  'object-property': phraseObjectProperty,
  'object-property-method': phraseObjectProperty,
  'object-property-spread': phraseObjectProperty,
  'object-literal-close': phraseObjectLiteralClose,
};

export function toDisplayNode(node: SemanticNode): DisplayNodeData {
  const phrase = PHRASERS[node.type] ?? phraseFallback;
  return {
    indent: node.indent,
    spans: phrase(node),
    children: node.children.map(toDisplayNode),
    sourceStartLine: node.sourceStartLine,
    sourceEndLine: node.sourceEndLine,
    bucket: bucketForNode(node),
  };
}
