import type { NodeVariant } from './types';

export const VARIANT_CLASSES: Record<NodeVariant, string> = {
  kw: 'text-purple-700 font-semibold',
  ident: 'text-slate-800',
  'tag-name': 'text-sky-700 font-semibold',
  'attr-name': 'text-emerald-700',
  'attr-value': 'text-amber-700',
  string: 'text-rose-700',
  punct: 'text-slate-400',
  param: 'text-slate-600 italic',
  'fn-name': 'text-blue-700 font-semibold',
};

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
