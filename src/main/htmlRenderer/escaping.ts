export function escapeHtml(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    switch (ch) {
      case '&'  : result += '&' + 'amp;';  break;
      case '<'  : result += '&' + 'lt;';   break;
      case '>'  : result += '&' + 'gt;';   break;
      case '"' : result += '&' + 'quot;'; break;
      case "'" : result += '&' + 'apos;'; break;
      default: result += ch;
    }
  }
  return result;
}

export function escapeAttribute(text: string): string {
  return escapeHtml(text);
}

export function escapePath(text: string): string {
  return escapeHtml(text);
}

export function escapeIdentifier(text: string): string {
  return escapeHtml(text);
}

export function escapeSourceText(text: string): string {
  return escapeHtml(text);
}

export function escapeMetadata(text: string): string {
  return escapeHtml(text);
}

export function escapeSnippet(text: string): string {
  return escapeHtml(text);
}

export function escapeError(error: unknown): string {
  if (error instanceof Error) return escapeHtml(error.message);
  if (typeof error === 'string') return escapeHtml(error);
  return escapeHtml(String(error));
}
