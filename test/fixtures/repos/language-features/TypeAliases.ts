// Union types
type Status = 'active' | 'inactive' | 'deleted';
type Result<T> = { ok: true; value: T } | { ok: false; error: string };

// Intersection types
type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;

// Literal types
type Direction = 'north' | 'south' | 'east' | 'west';
type YesNo = true | false;

// Mapped types
type Readonly2<T> = { readonly [K in keyof T]: T[K] };
type Optional2<T> = { [K in keyof T]?: T[K] };

// Conditional types
type IsString<T> = T extends string ? 'yes' : 'no';
type Test1 = IsString<'hello'>;
type Test2 = IsString<42>;

// Template literal types
type EventName = `on${Capitalize<string>}`;
type HexColor = `#${string}`;

// Utility types
type PartialPerson = Partial<Person>;
type RequiredPerson = Required<PartialPerson>;
type PickName = Pick<Person, 'name'>;
type OmitAge = Omit<Person, 'age'>;

export type { Status, Result, Person, Direction, Readonly2, Optional2, EventName, PartialPerson, PickName };
