import { Shape } from './Shape.js';
import { Group } from './Group.js';
import { Value } from './Value.js';

export class Drawing {
  private root = new Group('__canvas__');
  private canvasWidth: number;
  private canvasHeight: number;
  constructor(width = 800, height = 600) { this.canvasWidth = Value.positive(width, 'canvas width'); this.canvasHeight = Value.positive(height, 'canvas height'); }
  get width(): number { return this.canvasWidth; }
  get height(): number { return this.canvasHeight; }
  get children(): readonly Shape[] { return this.root.children; }
  get presentation(): Readonly<Record<string, string>> { return this.root.attributes; }
  setPresentation(attribute: string, value: string): void { this.root.importPresentation(attribute, value); }
  resize(w: number, h: number): void { Value.positive(w, 'canvas width'); Value.positive(h, 'canvas height'); this.canvasWidth = w; this.canvasHeight = h; }
  all(): Shape[] {
    const visit = (node: Shape): Shape[] => [node, ...node.children.flatMap(visit)];
    return this.children.flatMap(visit);
  }
  find(id: string): Shape { const found = this.all().find(node => node.id === id); if (!found) throw new Error(`no such shape: ${id}`); return found; }
  private available(id: string): void { Value.id(id); if (this.all().some(node => node.id === id)) throw new Error(`id already exists: ${id}`); }
  container(id: string): Group {
    const found = this.all().find(node => node.id === id);
    if (!found) throw new Error(`no such container: ${id}`);
    if (!(found instanceof Group)) throw new Error(`not a container: ${id}`);
    return found;
  }
  private parent(shape: Shape): Group {
    return [this.root, ...this.all().filter(node => node instanceof Group)].find(node => node.children.includes(shape))!;
  }
  parentLabel(shape: Shape): string { const parent = this.parent(shape); return parent === this.root ? 'svg' : parent.label; }
  add(shape: Shape, containerId?: string): void {
    const nodes = [shape];
    const collect = (node: Shape): void => { node.children.forEach(child => { nodes.push(child); collect(child); }); };
    collect(shape);
    const seen = new Set<string>();
    for (const node of nodes) { this.available(node.id); if (seen.has(node.id)) throw new Error(`id already exists: ${node.id}`); seen.add(node.id); }
    (containerId === undefined ? this.root : this.container(containerId)).insert(shape);
  }
  delete(id: string): string { const shape = this.find(id); this.parent(shape).remove(shape); return `${shape.label} deleted`; }
  group(id: string, ids: readonly string[]): string {
    this.available(id);
    if (ids.length === 0) throw new Error('group requires at least one shape');
    if (new Set(ids).size !== ids.length) throw new Error('duplicate group member');
    const selected = ids.map(member => this.find(member));
    for (const node of selected) if (node instanceof Group && selected.some(other => other !== node && node.contains(other))) throw new Error(`cannot group a container into its own descendant: ${node.id}`);
    // Preserve existing document preorder, independent of argument order.
    const ordered = this.all().filter(node => selected.includes(node));
    const parents = ordered.map(node => this.parent(node));
    const target = parents.every(parent => parent === parents[0]) ? parents[0]! : this.root;
    const index = target.children.indexOf(ordered[0]!);
    const group = new Group(id);
    ordered.forEach(node => { this.parent(node).remove(node); group.insert(node); });
    target.insert(group, index < 0 ? target.children.length : index);
    return `${group.label} created with ${ordered.length} children`;
  }
  ungroup(id: string): string {
    const group = this.container(id);
    const parent = this.parent(group);
    if (parent === this.root) throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.children.indexOf(group);
    parent.remove(group);
    group.children.forEach((child, offset) => { group.remove(child); parent.insert(child, index + offset); });
    return `${group.label} ungrouped`;
  }
  addTo(containerId: string, id: string): string {
    const container = this.container(containerId), shape = this.find(id);
    if (shape === container || (shape instanceof Group && shape.contains(container))) throw new Error(`cannot move a container into its own descendant: ${id}`);
    this.parent(shape).remove(shape); container.insert(shape);
    return `${shape.label} moved into ${container.label}`;
  }
  reorder(id: string, front: boolean): string {
    const shape = this.find(id), parent = this.parent(shape); parent.remove(shape); parent.insert(shape, front ? parent.children.length : 0);
    return `${shape.label} sent to ${front ? 'front' : 'back'}`;
  }
  clone(): Drawing { const copy = new Drawing(this.width, this.height); copy.root = this.root.clone(); return copy; }
}
