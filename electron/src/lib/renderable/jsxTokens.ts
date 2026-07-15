import type { SemanticNode } from '../makeSemanticGraph';
import type { InlineToken } from './types';
import { buildHover } from './hover/Tooltip';

function indent(prefix: string, count: number): InlineToken {
  return { text: prefix.repeat(count), variant: 'punct' };
}

function attrTokens(node: SemanticNode): InlineToken[] {
  const out: InlineToken[] = [];
  const meta = node.metadata;

  if (meta.props && typeof meta.props === 'object') {
    for (const [k, v] of Object.entries(meta.props as Record<string, unknown>)) {
      if (v === true) {
        out.push({ text: ' ', variant: 'punct' });
        out.push({ text: k, variant: 'attr-name' });
      } else {
        out.push({ text: ' ', variant: 'punct' });
        out.push({ text: k, variant: 'attr-name' });
        out.push({ text: '=', variant: 'punct' });
        if (typeof v === 'string') {
          out.push({
            text: `"${v}"`,
            variant: 'string',
            hover: buildHover(k, String(v)),
          });
        } else {
          out.push({ text: `{${String(v)}}`, variant: 'ident' });
        }
      }
    }
  }

  if (meta.events && Array.isArray(meta.events) && meta.events.length > 0) {
    for (const ev of meta.events as Array<{ name: string; description: string }>) {
      out.push({ text: ' ', variant: 'punct' });
      out.push({ text: ev.name, variant: 'attr-name' });
      out.push({ text: '=', variant: 'punct' });
      out.push({ text: '{...}', variant: 'ident' });
    }
  }

  if (meta.href) {
    out.push({ text: ' href=', variant: 'punct' });
    out.push({
      text: `"${meta.href}"`,
      variant: 'string',
      hover: buildHover('href', String(meta.href)),
    });
  }
  if (meta.src) {
    out.push({ text: ' src=', variant: 'punct' });
    out.push({
      text: `"${meta.src}"`,
      variant: 'string',
      hover: buildHover('src', String(meta.src)),
    });
  }
  if (meta.alt) {
    out.push({ text: ' alt=', variant: 'punct' });
    out.push({ text: `"${meta.alt}"`, variant: 'string' });
  }

  return out;
}

function classNameTokens(node: SemanticNode): InlineToken[] {
  const meta = node.metadata;
  if (meta.className) {
    return [
      { text: ' className=', variant: 'punct' },
      {
        text: `"${meta.className}"`,
        variant: 'attr-value',
        hover: meta.classNameDescription
          ? buildHover('className', String(meta.classNameDescription), {
              classes: meta.className,
            })
          : buildHover('className', String(meta.className)),
      },
    ];
  }
  return [];
}

export function jsxSubTokens(node: SemanticNode): InlineToken[] {
  switch (node.type) {
    case 'jsx-element': {
      const tokens: InlineToken[] = [
        indent('  ', node.indent),
        { text: '<', variant: 'punct' },
        {
          text: node.name!,
          variant: 'tag-name',
          hover: buildHover(node.name!, String(node.metadata.tagDescription ?? '')),
        },
        ...classNameTokens(node),
        ...attrTokens(node),
        { text: '>', variant: 'punct' },
      ];
      return tokens;
    }

    case 'jsx-fragment':
      return [
        indent('  ', node.indent),
        { text: '<>', variant: 'punct' },
        { text: '…', variant: 'punct' },
        { text: '</>', variant: 'punct' },
      ];

    case 'jsx-list':
      return [
        indent('  ', node.indent),
        {
          text: `For each ${node.metadata.itemName} in ${node.metadata.collection}:`,
          variant: 'kw',
        },
      ];

    case 'jsx-filter':
      return [
        indent('  ', node.indent),
        {
          text: `Filter ${node.metadata.collection} where ${node.metadata.condition}:`,
          variant: 'kw',
        },
      ];

    case 'jsx-conditional':
      return [
        indent('  ', node.indent),
        {
          text:
            node.metadata.variant === 'ternary'
              ? `If ${node.metadata.condition}, show:`
              : `When ${node.metadata.condition}, show:`,
          variant: 'kw',
        },
      ];

    case 'jsx-conditional-alt':
      return [indent('  ', node.indent), { text: 'Otherwise, show:', variant: 'kw' }];

    case 'jsx-text': {
      const text = String(node.metadata.text);
      const display = text.length > 60 ? `${text.slice(0, 57)}...` : text;
      return [
        indent('  ', node.indent),
        { text: `Show text: "${display}"`, variant: 'string' },
      ];
    }

    case 'jsx-expression': {
      if (node.metadata.isTemplate) {
        return [
          indent('  ', node.indent),
          { text: `Show dynamic text: ${node.metadata.expression}`, variant: 'ident' },
        ];
      }
      return [
        indent('  ', node.indent),
        { text: `Show: ${node.metadata.expression}`, variant: 'ident' },
      ];
    }

    default:
      return [{ text: `[${node.type}]`, variant: 'ident' }];
  }
}
