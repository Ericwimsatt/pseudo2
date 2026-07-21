// String literals
const greeting = 'Hello';
const name = 'World';
const template = `${greeting}, ${name}!`;

// Number and bigint
const count = 42;
const big = 9007199254740991n;

// Boolean and null/undefined
const isDone = false;
const empty = null;
const notDefined = undefined;

// Object literal
const point = { x: 10, y: 20 };

// Array literal
const numbers = [1, 2, 3, 4];

// Computed property name
const key = 'dynamic';
const obj = { [key]: 'value' };

// Method shorthand
const calc = {
  add(a: number, b: number) {
    return a + b;
  },
};

// Spread operator
const merged = { ...point, z: 30 };
const allNums = [...numbers, 5, 6];

// Destructuring
const [first, ...rest] = numbers;
const { x, y } = point;

// Nullish coalescing
const input = null;
const value = input ?? 'default';

// Optional chaining
interface User { address?: { street: string } }
const user: User = {};
const street = user.address?.street;

export { merged, allNums, first, rest, value, street };
