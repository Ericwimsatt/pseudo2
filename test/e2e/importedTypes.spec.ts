// @critical @p1 @core:translation
import { test, expect } from '@playwright/test';
import { buildFileData } from '../../src/main/translationService/buildFileData';
import { renderTemplate } from '../fixtures/phrasingRules';

// The type-alias rule renders the part up to (and not including) the {type}
// template variable. Pull that from phrasing-rules.json so wording edits to
// the rule template (e.g. "Type Foo =" -> "Define Foo =") keep this test green.
function typeAliasUpTo(name: string): string {
  return renderTemplate('type-alias', { name, type: '' }).trimEnd();
}

test.describe('type alias display @critical @p1 @core:translation', () => {

  test('locally-defined type alias should not show full import path', () => {
    const source = `export type AnalyticsPeriod = "this_week" | "this_month" | "this_quarter" | "this_year" | "last_month" | "last_quarter" | "last_year" | "custom";`;
    const { viewModel } = buildFileData(source, '/Users/ericwimsatt/git/pseudo2/src/hooks/AnalyticsPeriod.ts');
    const allText = viewModel.lines.map(l => l.nodes.map(n => n.spans.map(s => s.text).join('')).join('')).join('\n');

    expect(allText).toContain(typeAliasUpTo('AnalyticsPeriod'));
    expect(allText).toContain('this_week');
    expect(allText).not.toMatch(/import\(["']\/.*["']\)/);
  });

  test('type alias display uses type annotation text not resolved type path', () => {
    const source = `export type Period = "daily" | "weekly" | "monthly";`;
    const { viewModel } = buildFileData(source, 'types.ts');
    const allText = viewModel.lines.map(l => l.nodes.map(n => n.spans.map(s => s.text).join('')).join('')).join('\n');

    expect(allText).toContain(typeAliasUpTo('Period'));
    expect(allText).toContain('daily');
    expect(allText).not.toMatch(/import\(/);
  });

});
