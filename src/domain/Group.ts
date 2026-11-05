import { Shape } from './Shape.js';
import { Value } from './Value.js';
export class Group extends Shape {
  private nodes: Shape[] = [];
  override get tag(): string { return 'g'; }
  override get children(): readonly Shape[] { return [...this.nodes]; }
  contains(shape: Shape): boolean { return this === shape || this.nodes.some(node => node === shape || (node instanceof Group && node.contains(shape))); }
  insert(shape: Shape, index = this.nodes.length): void {
    if (shape === this || (shape instanceof Group && shape.contains(this))) throw new Error(`cannot move a container into its own descendant: ${shape.id}`);
    if (this.contains(shape)) throw new Error(`shape already in container: ${shape.id}`);
    this.nodes.splice(index, 0, shape);
  }
  remove(shape: Shape): void {
    const index = this.nodes.indexOf(shape);
    if (index < 0) throw new Error(`shape is not a child: ${shape.id}`);
    this.nodes.splice(index, 1);
  }
  override move(dx: number, dy: number): void { Value.number(dx); Value.number(dy); this.nodes.forEach(node => node.move(dx, dy)); }
  override scale(factor: number): void { Value.positive(factor, 'scale factor'); this.nodes.forEach(node => node.scale(factor)); }
  override clone(): Group { const copy = new Group(this.id); this.copyStyles(copy); this.nodes.forEach(node => copy.insert(node.clone())); return copy; }
  override get summary(): string { return [this.label, this.styleSummary].filter(Boolean).join('  '); }
}
