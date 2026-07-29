import { describe, it, expect } from 'vitest';
import { renderTooltip } from '../../../src/main/htmlRenderer/tooltipRenderer';
import type { TooltipSection } from '../../../src/main/translationService/renderable/types';

const OPEN_ENTITY = String.fromCharCode(38) + 'lt' + String.fromCharCode(59) + 'script' + String.fromCharCode(38) + 'gt' + String.fromCharCode(59);
const _CLOSE_ENTITY = String.fromCharCode(38) + 'lt' + String.fromCharCode(59) + '/script' + String.fromCharCode(38) + 'gt' + String.fromCharCode(59);

describe('tooltipRenderer', () => {
  const mockSections: TooltipSection[] = [
    { type: 'definition', line: 10, snippet: [] },
    { type: 'type', text: 'string' },
    { type: 'references', items: [
      { line: 15, filePath: '/src/file.ts', snippet: [] },
      { line: 20, filePath: '/src/other.ts', snippet: [] },
    ]},
  ];

  it('renders tooltip with sections', () => {
    const result = renderTooltip({ sections: mockSections });

    expect(result.html).toContain('data-role="tooltip-content"');
    expect(result.html).toContain('data-testid="tooltip-content"');
    expect(result.html).toContain('Definition (line 10):');
    expect(result.html).toContain('Type:');
    expect(result.html).toContain('string');
    expect(result.html).toContain('References:');
  });

  it('renders definition section with link', () => {
    const sections: TooltipSection[] = [
      { type: 'definition', line: 5, snippet: [] },
    ];
    const result = renderTooltip({ sections });

    expect(result.html).toContain('data-role="tooltip-definition"');
    expect(result.html).toContain('data-role="tooltip-definition-link"');
    expect(result.html).toContain('data-line-number="5"');
  });

  it('renders type section', () => {
    const sections: TooltipSection[] = [
      { type: 'type', text: 'number' },
    ];
    const result = renderTooltip({ sections });

    expect(result.html).toContain('data-role="tooltip-type"');
    expect(result.html).toContain('number');
  });

  it('renders references section with items', () => {
    const sections: TooltipSection[] = [
      { type: 'references', items: [
        { line: 10, filePath: '/src/a.ts', snippet: [] },
        { line: 20, filePath: '/src/b.ts', snippet: [] },
      ]},
    ];
    const result = renderTooltip({ sections });

    expect(result.html).toContain('data-role="tooltip-references"');
    expect(result.html).toContain('a.ts:10');
    expect(result.html).toContain('b.ts:20');
    expect(result.html).toContain('data-role="tooltip-reference-link"');
  });

  it('shows "No information available" for empty sections', () => {
    const result = renderTooltip({ sections: [] });

    expect(result.html).toContain('No information available');
  });

  it('escapes HTML in type text', () => {
    const sections: TooltipSection[] = [
      { type: 'type', text: '<script>alert(1)</script>' },
    ];
    const result = renderTooltip({ sections });

    expect(result.html).toContain(OPEN_ENTITY);
    expect(result.html).not.toContain('<script>');
  });

  it('includes metadata', () => {
    const result = renderTooltip({ sections: mockSections });

    expect(result.metadata.kind).toBe('tooltip');
    expect(result.metadata.timestamp).toBeTypeOf('number');
  });

  it('passes filePath to definition link for navigation', () => {
    const sections: TooltipSection[] = [
      { type: 'definition', line: 5, snippet: [
        { lineNumber: 5, sourceText: 'const x = 1', nodes: [{ indent: 0, spans: [{ text: 'const x = 1' }], children: [], sourceStartLine: 5, sourceEndLine: 5, bucket: 'standard', nested: false }] },
      ]},
    ];
    const result = renderTooltip({ sections, filePath: 'src/main.ts' });

    expect(result.html).toContain('data-file-path="src/main.ts"');
    expect(result.html).toContain('data-role="snippet-line-link"');
  });

  it('renders definition link without filePath when not provided', () => {
    const sections: TooltipSection[] = [
      { type: 'definition', line: 5, snippet: [] },
    ];
    const result = renderTooltip({ sections });

    expect(result.html).toContain('data-role="tooltip-definition-link"');
  });
});
