import { useState } from 'react';

/** Greets a user by name. */
function greet(name: string): string {
  return `Hello, ${name}`;
}

// Arrow function with block body
const add = (a: number, b: number): number => {
  return a + b;
};

// Arrow function with expression body
const double = (x: number) => x * 2;

// Default parameters
function createMessage(text: string, prefix = 'INFO'): string {
  return `${prefix}: ${text}`;
}

// Rest parameters
function sumAll(...nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}

// Destructured parameters
function printUser({ name, age }: { name: string; age: number }): void {
  console.log(`${name} is ${age} years old`);
}

// Generic function
function identity<T>(value: T): T {
  return value;
}
