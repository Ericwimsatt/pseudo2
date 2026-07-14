import type { HoverContent } from './types';

export function buildHover(
  title: string,
  body?: string,
  metadata?: Record<string, unknown>
): HoverContent {
  const h: HoverContent = { title };
  if (body) h.body = body;
  if (metadata) h.metadata = metadata;
  return h;
}

export function formatMetadata(metadata: Record<string, unknown> | undefined): string {
  if (!metadata) return '';
  const lines: string[] = [];
  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      lines.push(`${key}: ${value.join(', ')}`);
    } else if (typeof value === 'object') {
      const nested = Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      if (nested) lines.push(`${key}: ${nested}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.join('\n');
}
