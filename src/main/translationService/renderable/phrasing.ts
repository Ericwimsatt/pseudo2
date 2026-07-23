import type { SemanticNode } from '../makeSemanticGraph';
import type { DisplayNodeData, DisplaySpan } from './types';
import { bucketForNode } from './bucket';
import { translateType } from './translateType';
import phrasingRules from '../../../../config/phrasing-rules.json' with { type: 'json' };

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
  return rule.template.replace(/\{(\w+)(?:@(?:ref|hover))?\}/g, (_, key) => {
    if (key in vars) return String(vars[key]);
    return `{${key}}`;
  });
}

function ts(
  type: string,
  vars: Record<string, string | undefined>,
  refPos?: number,
): DisplaySpan[] {
  const rule = RULES.find(r => r.type === type);
  if (!rule) return [span(`[${type}]`)];

  const spans: DisplaySpan[] = [];
  const regex = /\{(\w+)@ref\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const resolveVars = (text: string): string =>
    text.replace(/\{(\w+)(?:@\w+)?\}/g, (_, key: string) => vars[key] ?? `{${key}}`);

  while ((match = regex.exec(rule.template)) !== null) {
    const before = rule.template.slice(lastIndex, match.index);
    if (before) {
      spans.push(span(resolveVars(before)));
    }

    const varName = match[1];
    const value = vars[varName] ?? `{${varName}}`;
    spans.push(span(value, refPos));

    lastIndex = match.index + match[0].length;
  }

  const after = rule.template.slice(lastIndex);
  if (after) {
    spans.push(span(resolveVars(after)));
  }

  return spans;
}

type Phraser = (node: SemanticNode) => DisplaySpan[];

function span(text: string, refPos?: number): DisplaySpan {
  const result: DisplaySpan = { text };
  if (refPos !== undefined) {
    result.refPos = refPos;
    result.hasHover = true;
  }
  return result;
}

function exportedPrefix(node: SemanticNode): DisplaySpan[] {
  if (!node.metadata.exported) return [];
  return [span('Export: ')];
}

function phraseImport(node: SemanticNode): DisplaySpan[] {
  const names = String(node.name ?? '');
  const module = String(node.metadata.module ?? '');
  return ts('import', { names, module }, node.refPos);
}

function phraseExport(node: SemanticNode): DisplaySpan[] {
  const names = String(node.name ?? '');
  const module = String(node.metadata.module ?? '');
  const verb = names.includes(',') ? 'are' : 'is';
  if (module) {
    return ts('export-re-export', { names, verb, module }, node.refPos);
  }
  return ts('export', { names, verb }, node.refPos);
}

function phraseFunctionDefinition(node: SemanticNode): DisplaySpan[] {
  const params = (node.metadata.parameters as string[]) ?? [];
  if (params.length > 0) {
    return [...exportedPrefix(node), ...ts('function-definition', {
      name: node.name ?? 'anonymous',
      params: params.join(', '),
    }, node.refPos)];
  }
  if (node.name) {
    return [...exportedPrefix(node), ...ts('function-definition-no-params', { name: node.name }, node.refPos)];
  }
  return [...exportedPrefix(node), span(t('function-definition-anonymous', {}))];
}

function phraseClass(node: SemanticNode): DisplaySpan[] {
  const name = node.name ?? 'anonymous';
  if (node.metadata.extends) {
    return [...exportedPrefix(node), ...ts('class-extended', { name, extends: String(node.metadata.extends) }, node.refPos)];
  }
  return [...exportedPrefix(node), ...ts('class', { name }, node.refPos)];
}

function phraseInterface(node: SemanticNode): DisplaySpan[] {
  return [...exportedPrefix(node), ...ts('interface', { name: node.name ?? 'anonymous' }, node.refPos)];
}

function phraseTypeAlias(node: SemanticNode): DisplaySpan[] {
  return [...exportedPrefix(node), ...ts('type-alias', { name: node.name ?? 'anonymous', type: String(node.metadata.type ?? '') }, node.refPos)];
}

function phraseProperty(node: SemanticNode): DisplaySpan[] {
  const name = node.name ?? 'anonymous';
  const type = String(node.metadata.type ?? 'any');
  const init = node.metadata.initializer as string | null;
  if (init) {
    return ts('property-with-init', { name, type: translateType(type), initializer: init }, node.refPos);
  }
  return ts('property', { name, type: translateType(type) }, node.refPos);
}

function phraseVariableAssignment(node: SemanticNode): DisplaySpan[] {
  const name = node.name ?? 'anonymous';
  const init = node.metadata.initializer as string | null;
  if (init) {
    return [...exportedPrefix(node), ...ts('variable-assignment', { name, initializer: init }, node.refPos)];
  }
  if (node.children && node.children.length > 0) {
    return [...exportedPrefix(node), ...ts('variable-assignment-target', { name }, node.refPos)];
  }
  return [...exportedPrefix(node), span(`\`${name}\``, undefined, node.refPos)];
}

function phraseReturn(node: SemanticNode): DisplaySpan[] {
  if (node.metadata.hasJsx) return [span(t('return-jsx', {}))];
  const value = node.metadata.value as string | null;
  if (value) return [span(t('return-value', { value }))];
  if (node.children.length > 0) return [span(t('return-target', {}))];
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
  if (node.metadata.isNew) {
    return ts('instantiate', { function: fn }, node.refPos);
  }
  return ts('call-function', { function: fn }, node.refPos);
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
    spans.push(span(' className='), span(`"${meta.className}"`));
  } else if (meta.classNameDescription) {
    spans.push(span(' className='), span(`"${meta.classNameDescription}"`));
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
        spans.push(span(`{${ev.handlerName}}`, ev.handlerRefPos));
      } else {
        spans.push(span('{...}'));
      }
    }
  }

  if (meta.href) {
    spans.push(span(' href='), span(`"${meta.href}"`));
  }

  if (meta.src) {
    spans.push(span(' src='), span(`"${meta.src}"`));
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
    span(name, node.refPos),
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
    return ts('jsx-expression-identifier', { expression: expr }, node.refPos);
  }
  return [span(t('jsx-expression', { expression: expr }))];
}

function phraseTernaryCondition(node: SemanticNode): DisplaySpan[] {
  return [span(t('ternary-condition', { condition: String(node.metadata.condition) }))];
}

function phraseTernaryOtherwise(): DisplaySpan[] {
  return [span(t('ternary-otherwise', {}))];
}

function phraseTernaryValue(node: SemanticNode): DisplaySpan[] {
  return [span(t('ternary-value', { value: String(node.metadata.value) }))];
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
  'return-target': phraseReturn,
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
  'ternary-condition': phraseTernaryCondition,
  'ternary-otherwise': phraseTernaryOtherwise,
  'ternary-value': phraseTernaryValue,
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
