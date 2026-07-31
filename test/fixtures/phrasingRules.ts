import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Test utility for read access to `config/phrasing-rules.json`.
 *
 * Tests that don't care about THE EXACT wording of the rules (most of the
 * suite) should derive their expected output strings from this table instead
 * of hard-coding phrasing literals. That way changing the wording of a rule
 * template updates the expected string in lock-step with the production
 * output — the test keeps passing for any wording change that doesn't also
 * change the rule's structure (e.g. removing a `{name}` placeholder).
 *
 * The ONE place that tests the exact outputs produced by a fixed rule set is
 * `test/unit/core/phrasing.vitest.ts`, which mocks the rules with synthetic
 * templates and asserts against them.
 */

export interface PhrasingRule {
  type: string;
  template: string;
  children?: { open: string; close: string };
}

const RULES_PATH = resolve(
  import.meta.dirname,
  '..',
  '..',
  'config',
  'phrasing-rules.json',
);

const RAW = JSON.parse(readFileSync(RULES_PATH, 'utf8')) as PhrasingRule[];

/** All phrasing rules in declaration order. Frozen so tests can't mutate them. */
export const PHRASING_RULES: readonly PhrasingRule[] = Object.freeze(
  RAW.map((r) => ({ ...r })),
);

/** Lookup table keyed by rule `type`. */
export const PHRASING_TABLE: Readonly<Record<string, PhrasingRule>> =
  Object.freeze(Object.fromEntries(RAW.map((r) => [r.type, r])));

export function ruleFor(type: string): PhrasingRule {
  const r = PHRASING_TABLE[type];
  if (!r) throw new Error(`No phrasing rule found for "${type}"`);
  return r;
}

const PLACEHOLDER_RE = /\{(\w+)(?:@(?:ref|hover))?\}/g;

/**
 * Substitute placeholder vars into a rule's template, exactly the way the
 * production `t()` helper does. Missing vars are left as `{name}` literals —
 * pass `''` to elide a placeholder.
 */
export function renderTemplate(
  type: string,
  vars: Record<string, string> = {},
): string {
  const rule = PHRASING_TABLE[type];
  if (!rule) return `[${type}]`;
  return rule.template.replace(PLACEHOLDER_RE, (_, key: string) =>
    key in vars ? vars[key] : `{${key}}`,
  );
}

/**
 * The verbatim prefix of a rule's template — everything before the first
 * `{...}` placeholder. With no placeholder, returns the whole template.
 *
 * e.g. `templatePrefix('function-definition') === 'Function '`
 *      `templatePrefix('if')                === 'If '`
 *      `templatePrefix('return-jsx')        === 'Return Visual Elements:'`
 */
export function templatePrefix(type: string): string {
  const t = PHRASING_TABLE[type]?.template ?? '';
  const i = t.search(PLACEHOLDER_RE);
  return i < 0 ? t : t.slice(0, i);
}

/** The literal substring of a template that sits between two named
 * placeholders (text only, excluding both placeholders). Returns `''` if
 * either placeholder is absent or ordered incorrectly.
 *
 * e.g. `templateLiteralBetween('function-definition', 'name', 'params')`
 *      === ' args: {'
 */
export function templateLiteralBetween(
  type: string,
  varA: string,
  varB: string,
): string {
  const t = PHRASING_TABLE[type]?.template ?? '';
  const startTok = t.indexOf(`{${varA}`);
  const endTok = t.indexOf(`{${varB}`);
  if (startTok < 0 || endTok <= startTok) return '';
  const afterAClose = t.indexOf('}', startTok) + 1;
  return t.slice(afterAClose, endTok);
}

/** Render the template, stopping just before a named placeholder. */
export function renderUpTo(
  type: string,
  vars: Record<string, string>,
  stopVar: string,
): string {
  const t = PHRASING_TABLE[type]?.template ?? '';
  const stop = t.indexOf(`{${stopVar}`);
  const slice = stop < 0 ? t : t.slice(0, stop);
  return slice.replace(PLACEHOLDER_RE, (_, key: string) =>
    key in vars ? vars[key] : `{${key}}`,
  );
}

export function childrenOpen(type: string): string {
  return PHRASING_TABLE[type]?.children?.open ?? '';
}

export function childrenClose(type: string): string {
  return PHRASING_TABLE[type]?.children?.close ?? '';
}

/**
 * Render the spans text a single-line, childless DisplayNode with this type
 * would produce: template + children.open + children.close.
 * Mirrors `collectStartLineSpans`'s "else if (closeText && same line)" branch
 * in `viewModel.ts` for inline-able single-line nodes.
 */
export function phraseSingleLine(
  type: string,
  vars: Record<string, string> = {},
): string {
  return renderTemplate(type, vars) + childrenOpen(type) + childrenClose(type);
}

/**
 * Render the spans text for the OPENING line of a multi-line node:
 * template + children.open (no close brace, which lives on a later line).
 */
export function phraseOpen(
  type: string,
  vars: Record<string, string> = {},
): string {
  return renderTemplate(type, vars) + childrenOpen(type);
}