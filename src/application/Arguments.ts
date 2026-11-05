import { Value } from '../domain/Value.js';
export class Arguments {
  constructor(private readonly values: readonly string[]) {}
  count(min: number, max = min): void { if (this.values.length < min || this.values.length > max) throw new Error('invalid arguments; type help for syntax'); }
  at(index: number): string { const value = this.values[index]; if (value === undefined) throw new Error('missing argument'); return value; }
  number(index: number): number { return Value.number(this.at(index)); }
  get all(): readonly string[] { return [...this.values]; }
}
