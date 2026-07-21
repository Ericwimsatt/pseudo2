// Abstract class
export abstract class Animal {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  abstract speak(): string;

  public move(): string {
    return `${this.name} moves`;
  }
}

// Class extends and implements
export interface Pet {
  play: () => string;
}

export class Dog extends Animal implements Pet {
  private breed: string;

  constructor(name: string, breed: string) {
    super(name);
    this.breed = breed;
  }

  speak(): string {
    return 'Woof!';
  }

  play(): string {
    return `${this.name} plays fetch`;
  }

  // Getter
  get description(): string {
    return `${this.name} is a ${this.breed}`;
  }

  // Setter
  set description(value: string) {
    const parts = value.split(' is a ');
    this.name = parts[0] || 'unknown';
    this.breed = parts[1] || 'unknown';
  }

  // Static member
  static species: string = 'Canis familiaris';
}
