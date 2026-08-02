import type { SemanticNode } from '../makeSemanticGraph';
import type { DisplayNodeData, DisplaySpan } from './types';
import { bucketForNode } from './bucket';
import { translateType } from './translateType';
import phrasingRules from '../../../../config/phrasing-rules.json' with { type: 'json' };
import { highlightTranslationSpans } from './syntaxHighlight';

interface PhrasingRule {
  type: string;
  template: string;
  children?: { open: string; close: string };
}

let RULES: PhrasingRule[] = phrasingRules;

export function loadPhrasingRules(rules: PhrasingRule[]) {
  RULES = rules;
}

function variantForTemplateVariable(name: string): DisplaySpan['variant'] {
  if (name === 'function') return 'fn-name';
  if (name === 'params') return 'param';
  if (name === 'module' || name === 'text') return 'string';
  if (name === 'verb') return undefined;
  return 'ident';
}

function ts(
  type: string,
  vars: Record<string, string | undefined>,
  refPos?: number,
): DisplaySpan[] {
  const rule = RULES.find(r => r.type === type);
  if (!rule) return [span(`[${type}]`)];

  const spans: DisplaySpan[] = [];
  const regex = /\{(\w+)(?:@(ref|hover))?\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rule.template)) !== null) {
    const before = rule.template.slice(lastIndex, match.index);
    if (before) spans.push(span(before));

    const varName = match[1];
    const value = vars[varName] ?? `{${varName}}`;
    const placeholder = styledSpan(
      value,
      variantForTemplateVariable(varName),
      match[2] === 'ref' ? refPos : undefined,
    );
    spans.push(placeholder);

    lastIndex = match.index + match[0].length;
  }

  const after = rule.template.slice(lastIndex);
  if (after) spans.push(span(after));

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

function styledSpan(text: string, variant: DisplaySpan['variant'], refPos?: number): DisplaySpan {
  return { ...span(text, refPos), variant };
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
  return [...exportedPrefix(node), ...ts('function-definition-anonymous', {})];
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

function phraseTypeAliasLine(node: SemanticNode): DisplaySpan[] {
  return ts('type-alias-line', { value: String(node.metadata.value ?? '') });
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
  if (node.type === 'variable-assignment-target') {
    return [...exportedPrefix(node), ...ts('variable-assignment-target', { name }, node.refPos)];
  }
  if (init) {
    return [...exportedPrefix(node), ...ts('variable-assignment', { name, initializer: init }, node.refPos)];
  }
  return [...exportedPrefix(node), span(`\`${name}\``, node.refPos)];
}

function phraseReturn(node: SemanticNode): DisplaySpan[] {
  if (node.type === 'return-jsx') return ts('return-jsx', {});
  if (node.type === 'return-value') {
    return ts('return-value', { value: String(node.metadata.value ?? '') });
  }
  if (node.type === 'return-target') return ts('return-target', {});
  return ts('return', {});
}

function phraseIf(node: SemanticNode): DisplaySpan[] {
  return ts('if', { condition: String(node.metadata.condition) });
}

function phraseOtherwiseIf(node: SemanticNode): DisplaySpan[] {
  return ts('otherwise-if', { condition: String(node.metadata.condition) });
}

function phraseOtherwise(): DisplaySpan[] {
  return ts('otherwise', {});
}

function phraseLoop(node: SemanticNode): DisplaySpan[] {
  const loopType = node.metadata.loopType as string;
  if (loopType === 'forOf') return ts('loop-for-of', {});
  if (loopType === 'forIn') return ts('loop-for-in', { collection: String(node.metadata.collection ?? '') });
  return ts('loop', {});
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
    spans.push(
      span(' '),
      styledSpan('className', 'attr-name'),
      styledSpan('=', 'operator'),
      styledSpan(`"${meta.className}"`, 'attr-value'),
    );
  } else if (meta.classNameDescription) {
    spans.push(
      span(' '),
      styledSpan('className', 'attr-name'),
      styledSpan('=', 'operator'),
      styledSpan(`"${meta.classNameDescription}"`, 'attr-value'),
    );
  }

  if (meta.props && typeof meta.props === 'object') {
    for (const [name, value] of Object.entries(meta.props as Record<string, unknown>)) {
      if (value === true) {
        spans.push(span(' '), styledSpan(name, 'attr-name'));
      } else {
        spans.push(
          span(' '),
          styledSpan(name, 'attr-name'),
          styledSpan('=', 'operator'),
          styledSpan(`"${value}"`, 'attr-value'),
        );
      }
    }
  }

  if (Array.isArray(meta.events)) {
    for (const ev of meta.events as EventItem[]) {
      spans.push(span(' '), styledSpan(ev.name, 'attr-name'), styledSpan('=', 'operator'));
      if (ev.handlerName && ev.handlerRefPos !== undefined) {
        spans.push(span(`{${ev.handlerName}}`, ev.handlerRefPos));
      } else {
        spans.push(span('{...}'));
      }
    }
  }

  if (meta.href) {
    spans.push(span(' '), styledSpan('href', 'attr-name'), styledSpan('=', 'operator'), styledSpan(`"${meta.href}"`, 'attr-value'));
  }

  if (meta.src) {
    spans.push(span(' '), styledSpan('src', 'attr-name'), styledSpan('=', 'operator'), styledSpan(`"${meta.src}"`, 'attr-value'));
  }

  if (meta.alt) {
    spans.push(span(' '), styledSpan('alt', 'attr-name'), styledSpan('=', 'operator'), styledSpan(`"${meta.alt}"`, 'attr-value'));
  }

  return spans;
}

function phraseJsxElement(node: SemanticNode): DisplaySpan[] {
  const name = node.name!;
  const spans = [
    styledSpan('<', 'punct'),
    styledSpan(name, 'tag-name', node.refPos),
    ...phraseJsxAttrs(node),
  ];
  if (node.metadata.selfClosing) {
    spans.push(span(' '), styledSpan('/>', 'punct'));
  } else {
    spans.push(styledSpan('>', 'punct'));
  }
  return spans;
}

function phraseJsxFragment(): DisplaySpan[] {
  return ts('jsx-fragment', {});
}

function phraseJsxList(node: SemanticNode): DisplaySpan[] {
  return ts('jsx-list', { itemName: String(node.metadata.itemName), collection: String(node.metadata.collection) });
}

function phraseJsxFilter(node: SemanticNode): DisplaySpan[] {
  return ts('jsx-filter', { collection: String(node.metadata.collection), condition: String(node.metadata.condition) });
}

function phraseJsxConditional(node: SemanticNode): DisplaySpan[] {
  if (node.type === 'jsx-conditional-alt') return ts('jsx-conditional-alt', {});
  if (node.metadata.variant === 'ternary') return ts('jsx-conditional-ternary', { condition: String(node.metadata.condition) });
  return ts('jsx-conditional', { condition: String(node.metadata.condition) });
}

function phraseJsxText(node: SemanticNode): DisplaySpan[] {
  return ts('jsx-text', { text: String(node.metadata.text) });
}

function phraseJsxExpression(node: SemanticNode): DisplaySpan[] {
  const expr = String(node.metadata.expression);
  if (node.metadata.isTemplate) return ts('jsx-expression-template', { expression: expr });
  if (node.metadata.isSimpleIdentifier && node.refPos !== undefined) {
    return ts('jsx-expression-identifier', { expression: expr }, node.refPos);
  }
  return ts('jsx-expression', { expression: expr });
}

function phraseTernaryCondition(node: SemanticNode): DisplaySpan[] {
  return ts('ternary-condition', { condition: String(node.metadata.condition) });
}

function phraseTernaryOtherwise(): DisplaySpan[] {
  return ts('ternary-otherwise', {});
}

function phraseTernaryValue(node: SemanticNode): DisplaySpan[] {
  return ts('ternary-value', { value: String(node.metadata.value) });
}

function phraseObjectLiteral(): DisplaySpan[] {
  return ts('object-literal', {});
}

function phraseObjectProperty(node: SemanticNode): DisplaySpan[] {
  const name = node.name ?? '';
  if (node.metadata.isSpread) return ts('object-property-spread', { name });
  if (node.metadata.isMethod) return ts('object-property-method', { name });
  const value = node.metadata.value as string;
  if (value) return ts('object-property', { name, value });
  return ts('object-property', { name, value: '' });
}

function phraseObjectLiteralClose(node: SemanticNode): DisplaySpan[] {
  return ts('object-literal-close', { asSuffix: String(node.metadata.asSuffix ?? '') });
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
  'type-alias-line': phraseTypeAliasLine,
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

export function toDisplayNode(node: SemanticNode, depth = 0): DisplayNodeData {
  const phrase = PHRASERS[node.type] ?? phraseFallback;
  const spans = highlightTranslationSpans(phrase(node));
  const rule = RULES.find(r => r.type === node.type);
  const nested = !!rule?.children;
  if (nested) {
    spans.push(...highlightTranslationSpans([{ text: rule!.children!.open }]));
  }
  // JSX elements with children render HTML-style closing tags (`</div>`) on
  // their own line and draw nesting-box borders around the children region —
  // giving the visual hierarchy the previously-flat JSX output lacked.
  // Self-closing (`<x />`) and fragment (`<>…</>`) nodes keep their one-liner
  // rendering, so they are NOT treated as nested here.
  const isNestableJsxElement =
    node.type === 'jsx-element' &&
    !node.metadata.selfClosing &&
    node.children.length > 0;
  const finalNested = nested || isNestableJsxElement;
  const closeText = finalNested
    ? isNestableJsxElement
      ? `</${node.name}>`
      : rule!.children!.close
    : undefined;
  return {
    type: node.type,
    indent: depth,
    spans,
    children: node.children.map(c => toDisplayNode(c, depth + 1)),
    sourceStartLine: node.sourceStartLine,
    sourceEndLine: node.sourceEndLine,
    bucket: bucketForNode(node),
    nested: finalNested,
    closeText,
  };
}
