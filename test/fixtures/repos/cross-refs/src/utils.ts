export function formatValue(value: number): string {
  return value.toLocaleString();
}

export function calculateTotal(items: { value: number }[]): number {
  return items.reduce((sum, item) => sum + item.value, 0);
}

export function filterById<T extends { id: number }>(items: T[], id: number): T | undefined {
  return items.find((item) => item.id === id);
}
