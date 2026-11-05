import { GeometryShape } from './GeometryShape.js';
export class Text extends GeometryShape {
  constructor(id: string, x: number, y: number, private text: string) { super(id, { x, y }, ['x'], ['y'], []); }
  override get tag(): string { return 'text'; }
  override get content(): string { return this.text; }
  override set(attribute: string, value: string): void { if (attribute === 'text') this.text = value; else super.set(attribute, value); }
  protected override get geometrySummary(): string { return `(${this.value('x')},${this.value('y')}) ${JSON.stringify(this.text)}`; }
  override clone(): Text { const copy = new Text(this.id, this.value('x'), this.value('y'), this.text); this.copyStyles(copy); return copy; }
}
