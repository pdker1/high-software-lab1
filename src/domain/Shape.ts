import { Value } from './Value.js';

export abstract class Shape {
  private readonly identity: string;
  protected readonly styles = new Map<string, string>();
  constructor(id: string) { this.identity = Value.id(id); }
  get id(): string { return this.identity; }
  abstract get tag(): string;
  get label(): string { return `${this.tag}#${this.id}`; }
  get children(): readonly Shape[] { return []; }
  get content(): string | undefined { return undefined; }
  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract clone(): Shape;
  abstract get summary(): string;
  get attributes(): Readonly<Record<string, string>> { return Object.fromEntries(this.styles); }
  set(attribute: string, value: string): void {
    if (!['fill', 'stroke', 'stroke-width'].includes(attribute)) {
      throw new Error(`unknown attribute: ${attribute}`);
    }
    if (attribute === 'stroke-width' && Value.number(value) < 0) throw new Error('stroke-width must be non-negative');
    this.styles.set(attribute, value);
  }
  importPresentation(attribute: string, value: string): void {
    if (['fill', 'stroke', 'stroke-width'].includes(attribute)) this.set(attribute, value);
    else if (['font-size', 'font-family', 'font-weight', 'text-anchor', 'dominant-baseline', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray'].includes(attribute)) this.styles.set(attribute, value);
    else throw new Error(`unsupported SVG attribute: ${attribute}`);
  }
  protected copyStyles(target: Shape): void { this.styles.forEach((v, k) => target.styles.set(k, v)); }
  protected get styleSummary(): string { return [...this.styles].map(([k, v]) => `${k}=${v}`).join(' '); }
}
