export function translateType(rawType: string): string {
  const t = rawType.trim();

  const funcMatch = t.match(/^\((.+)\)\s*=>\s*(.+)$/);
  if (funcMatch) {
    const params = funcMatch[1].trim();
    const returns = funcMatch[2].trim();
    const returnDesc = returns === 'void' ? 'nothing' : translateType(returns);
    return `a function that expects  {${params}} and returns ${returnDesc}`;
  }

  const arrayMatch = t.match(/^(.+)\[\]$/);
  if (arrayMatch) {
    return `a list of ${translateType(arrayMatch[1].trim())}`;
  }

  const genericArrayMatch = t.match(/^(?:Array|ReadonlyArray)<(.+)>$/);
  if (genericArrayMatch) {
    return `a list of ${translateType(genericArrayMatch[1].trim())}`;
  }

  if (t.includes(' | ')) {
    const parts = t.split(' | ').map((p) => translateType(p.trim()));
    if (parts.includes('undefined')) {
      const filteredParts = parts.filter((p) => p !== 'undefined');
      if (filteredParts.length === 1) {
        return `${filteredParts[0]} (optional)`;
      }
      return `${filteredParts.join(' or ')} (optional)`;
    }
    return parts.join(' or ');
  }

  switch (t) {
    case 'string': return 'text';
    case 'number': return 'a number';
    case 'boolean': return "'true' or 'false'";
    case 'void': return 'nothing';
    case 'never': return 'nothing';
    case 'any': return 'anything';
    case 'null': return 'null';
    case 'undefined': return 'undefined';
    case 'true': return 'true';
    case 'false': return 'false';
  }

  if (/^['"]/.test(t) && /['"]$/.test(t)) return t;
  if (/^\d+$/.test(t)) return t;

  return t;
}
