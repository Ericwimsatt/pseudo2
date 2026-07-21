// Numeric enum
enum Direction {
  Up = 1,
  Down,
  Left,
  Right,
}

// String enum
enum Color {
  Red = 'RED',
  Green = 'GREEN',
  Blue = 'BLUE',
}

// Const enum
const enum Size {
  Small = 1,
  Medium = 2,
  Large = 3,
}

// Reverse mapping (numeric enums only)
const dirName = Direction[1];

export { Direction, Color, Size, dirName };
