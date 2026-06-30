/**
 * Source range primitives. A range identifies a span of text within a file.
 * 1-based, inclusive on both ends (matches editor convention).
 */

export interface Position {
  readonly line: number;
  readonly column: number;
}

export interface SourceRange {
  readonly start: Position;
  readonly end: Position;
}

export const positionKey = (pos: Position): string => `${pos.line}:${pos.column}`;

export const rangeKey = (range: SourceRange): string =>
  `${positionKey(range.start)}-${positionKey(range.end)}`;

export const containsPosition = (range: SourceRange, pos: Position): boolean => {
  if (pos.line < range.start.line || pos.line > range.end.line) return false;
  if (pos.line === range.start.line && pos.column < range.start.column) return false;
  if (pos.line === range.end.line && pos.column > range.end.column) return false;
  return true;
};

export const isEmptyRange = (range: SourceRange): boolean =>
  range.start.line === range.end.line && range.start.column === range.end.column;
