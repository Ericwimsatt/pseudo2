export function processItems(items: string[]) {
  // Array.map
  const lengths = items.map((s) => s.length);

  // Array.filter
  const long = items.filter((s) => s.length > 5);

  // Array.reduce
  const total = items.reduce((sum, s) => sum + s.length, 0);

  // Nested map
  const matrix = [[1, 2], [3, 4]];
  const doubled = matrix.map((row) => row.map((n) => n * 2));

  // Map with conditional
  const results = items.map((s) => (s.startsWith('a') ? s.toUpperCase() : s));

  // Set
  const unique = new Set(items);
  const hasFoo = unique.has('foo');

  // Map
  const lookup = new Map<string, number>();
  items.forEach((s, i) => lookup.set(s, i));

  // forEach
  items.forEach((s) => console.log(s));

  return { lengths, long, total, doubled, results, hasFoo, lookup };
}
