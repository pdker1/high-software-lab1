import { Shape } from './Shape.js';
import { Value } from './Value.js';

export abstract class GeometryShape extends Shape {
  private readonly geometry = new Map<string, number>();
  constructor(id: string, values: Record<string, number>, private readonly xKeys: readonly string[], private readonly yKeys: readonly string[], private readonly sizes: readonly string[]) {
    super(id);
    for (const [key, value] of Object.entries(values)) this.setGeometry(key, value);
  }
  protected value(key: string): number { return this.geometry.get(key)!; }
  private setGeometry(key: string, value: number): void {
    const n = Value.number(value);
    if (this.sizes.includes(key) && n < 0) throw new Error(`${key} must be non-negative`);
    this.geometry.set(key, n);
  }
  override set(attribute: string, value: string): void {
    if (this.geometry.has(attribute)) this.setGeometry(attribute, Value.number(value));
    else super.set(attribute, value);
  }
  override move(dx: number, dy: number): void {
    Value.number(dx); Value.number(dy);
    const next = new Map(this.geometry);
    for (const key of this.xKeys) next.set(key, Value.number(this.value(key) + dx));
    for (const key of this.yKeys) next.set(key, Value.number(this.value(key) + dy));
    next.forEach((value, key) => this.geometry.set(key, value));
  }
  override scale(factor: number): void {
    Value.positive(factor, 'scale factor');
    const next = [...this.geometry].map(([k, v]) => [k, Value.number(v * factor)] as const);
    next.forEach(([k, v]) => this.geometry.set(k, v));
  }
  override get attributes(): Readonly<Record<string, string>> {
    return { ...Object.fromEntries([...this.geometry].map(([k, v]) => [k, String(v)])), ...super.attributes };
  }
  protected abstract get geometrySummary(): string;
  override get summary(): string { return [this.label, this.geometrySummary, this.styleSummary].filter(Boolean).join('  '); }
}
