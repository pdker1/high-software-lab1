import type { Shape } from '../domain/Shape.js';
import type { Drawing } from '../domain/Drawing.js';
export class DrawingFormatter {
  tree(drawing: Drawing, id?: string): string[] {
    const lines: string[] = [];
    const descend = (children: readonly Shape[], prefix: string): void => {
      children.forEach((shape, index) => {
        const last = index === children.length - 1;
        lines.push(prefix + (last ? '└── ' : '├── ') + shape.summary);
        descend(shape.children, prefix + (last ? '    ' : '│   '));
      });
    };
    if (id !== undefined) { const shape = drawing.find(id); lines.push(shape.summary); descend(shape.children, ''); }
    else { lines.push(`svg (${drawing.width}x${drawing.height})`); descend(drawing.children, ''); }
    return lines;
  }
  show(drawing: Drawing, id: string): string[] {
    const shape = drawing.find(id);
    const lines = [`${shape.label}  parent=${drawing.parentLabel(shape)}`];
    for (const [key, value] of Object.entries(shape.attributes)) lines.push(`  ${key}=${value}`);
    if (shape.content !== undefined) lines.push(`  text=${JSON.stringify(shape.content)}`);
    if (shape.children.length) lines.push(`  children=${shape.children.map(child => child.id).join(',')}`);
    return lines;
  }
}
