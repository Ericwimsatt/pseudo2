// Interface extends
interface BaseProps {
  id: string;
  label: string;
}

interface ExtendedProps extends BaseProps {
  description?: string;
  readonly createdAt: Date;
}

// Index signature
interface StringMap {
  [key: string]: string;
}

// Call signature
interface StringProcessor {
  (input: string): string;
}

// Generic interface
interface Pair<T, U> {
  first: T;
  second: U;
}

// Intersection and union types in interface
interface WithMeta {
  meta: Record<string, unknown>;
  tags: string[];
}

type Combined = ExtendedProps & WithMeta;
type Status = 'active' | 'inactive' | 'pending';

export type { ExtendedProps, StringMap, StringProcessor, Pair, Combined, Status };
