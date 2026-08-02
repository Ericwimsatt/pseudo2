import ts from 'typescript';
import type { DisplaySpan, NodeVariant } from './types';

const TRANSLATION_KEYWORDS = new Set([
  'args',
  'as',
  'class',
  'const',
  'create',
  'each',
  'export',
  'extends',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'is',
  'loop',
  'null',
  'otherwise',
  'return',
  'text',
  'type',
  'when',
  'where',
]);

function variantForClassification(classification: string): NodeVariant | undefined {
  switch (classification) {
    case 'keyword':
      return 'kw';
    case 'identifier':
    case 'class name':
    case 'enum name':
    case 'interface name':
    case 'module name':
    case 'type alias name':
    case 'type parameter name':
      return 'ident';
    case 'parameter name':
      return 'param';
    case 'number':
    case 'bigint':
      return 'number';
    case 'string':
    case 'regular expression':
    case 'jsx attribute string literal value':
      return 'string';
    case 'comment':
    case 'doc comment tag name':
      return 'comment';
    case 'operator':
      return 'operator';
    case 'punctuation':
      return 'punct';
    case 'jsx open tag name':
    case 'jsx close tag name':
    case 'jsx self closing tag name':
      return 'tag-name';
    case 'jsx attribute':
      return 'attr-name';
  }
}

function scriptKindForPath(filePath: string): ts.ScriptKind {
  if (filePath.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (filePath.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (filePath.endsWith('.js')) return ts.ScriptKind.JS;
  if (filePath.endsWith('.json')) return ts.ScriptKind.JSON;
  return ts.ScriptKind.TS;
}

export function highlightSourceLines(sourceCode: string, filePath = 'file.ts'): DisplaySpan[][] {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    scriptKindForPath(filePath),
  );
  const cancellationToken: ts.CancellationToken = {
    isCancellationRequested: () => false,
    throwIfCancellationRequested: () => undefined,
  };
  const getSyntacticClassifications = (ts as unknown as {
    getSyntacticClassifications: (
      token: ts.CancellationToken,
      file: ts.SourceFile,
      span: ts.TextSpan,
    ) => { textSpan: ts.TextSpan; classificationType: string }[];
  }).getSyntacticClassifications;
  const classifications = getSyntacticClassifications(
    cancellationToken,
    sourceFile,
    { start: 0, length: sourceCode.length },
  );
  const lines: DisplaySpan[][] = [[]];

  const append = (text: string, variant?: NodeVariant) => {
    const pieces = text.split('\n');
    for (let i = 0; i < pieces.length; i++) {
      if (pieces[i]) lines[lines.length - 1].push(variant ? { text: pieces[i], variant } : { text: pieces[i] });
      if (i < pieces.length - 1) lines.push([]);
    }
  };

  let offset = 0;
  for (const classification of classifications) {
    const { start, length } = classification.textSpan;
    if (start > offset) append(sourceCode.slice(offset, start));
    append(
      sourceCode.slice(start, start + length),
      variantForClassification(classification.classificationType),
    );
    offset = start + length;
  }
  if (offset < sourceCode.length) append(sourceCode.slice(offset));

  return lines;
}

function inheritMetadata(span: DisplaySpan, text: string, variant?: NodeVariant): DisplaySpan {
  const result: DisplaySpan = { text };
  if (variant) result.variant = variant;
  if (span.refPos !== undefined) result.refPos = span.refPos;
  if (span.hasHover) result.hasHover = true;
  return result;
}

function translationVariant(text: string, source: DisplaySpan): NodeVariant | undefined {
  if (/^\s+$/.test(text)) return undefined;
  if (/^(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)$/.test(text)) {
    return source.refPos !== undefined ? 'ident' : 'string';
  }
  if (/^(?:\d+(?:\.\d+)?|\d+n)$/.test(text)) return 'number';
  if (/^[A-Za-z_$][\w$]*$/.test(text)) {
    if (TRANSLATION_KEYWORDS.has(text.toLowerCase())) return 'kw';
    if (source.refPos !== undefined) return source.variant ?? 'ident';
    return source.variant;
  }
  if (/^(?:=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|[=+\-*/%<>!&|?])$/.test(text)) {
    return 'operator';
  }
  if (/^[{}()[\],.:;]+$/.test(text)) return 'punct';
  return source.variant;
}

export function highlightTranslationSpans(spans: DisplaySpan[]): DisplaySpan[] {
  const tokenPattern = /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(?:\d+(?:\.\d+)?n?)|(?:[A-Za-z_$][\w$]*)|(?:=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?)|(?:\s+)|./gs;
  const result: DisplaySpan[] = [];

  for (const span of spans) {
    if (span.hasHover && span.refPos !== undefined) {
      result.push(inheritMetadata(span, span.text, span.variant ?? 'ident'));
      continue;
    }
    const tokens = span.text.match(tokenPattern) ?? [];
    const isTag = /^<\/?[A-Za-z_$]/.test(span.text);
    for (const token of tokens) {
      const variant = isTag && /^[A-Za-z_$][\w$]*$/.test(token)
        ? 'tag-name'
        : translationVariant(token, span);
      result.push(inheritMetadata(span, token, variant));
    }
  }

  return result;
}
