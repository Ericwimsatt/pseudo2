export interface SourceLocation {
  file: string
  start: Position
  end: Position
}

export interface Position {
  line: number
  column: number
  offset: number
}

export interface SourceRange {
  start: number
  end: number
}
