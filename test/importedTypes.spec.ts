import { test, expect } from '@playwright/test';
import { buildFileData } from '../src/lib/buildFileData';

test.describe('type alias display', () => {

  test('locally-defined type alias should not show full import path', () => {
    const source = `export type AnalyticsPeriod = "this_week" | "this_month" | "this_quarter" | "this_year" | "last_month" | "last_quarter" | "last_year" | "custom";`;
    const { viewModel } = buildFileData(source, '/Users/ericwimsatt/git/pseudo2/src/hooks/AnalyticsPeriod.ts');
    const allText = viewModel.lines.map(l => l.nodes.map(n => n.spans.map(s => s.text).join('')).join('')).join('\n');

    expect(allText).toContain('Type AnalyticsPeriod as');
    expect(allText).toContain('this_week');
    expect(allText).not.toMatch(/import\(["']\/.*["']\)/);
  });

  test('type alias display uses type annotation text not resolved type path', () => {
    const source = `export type Period = "daily" | "weekly" | "monthly";`;
    const { viewModel } = buildFileData(source, 'types.ts');
    const allText = viewModel.lines.map(l => l.nodes.map(n => n.spans.map(s => s.text).join('')).join('')).join('\n');

    expect(allText).toContain('Type Period as');
    expect(allText).toContain('daily');
    expect(allText).not.toMatch(/import\(/);
  });

});
