import { Shape } from './Shape.js';
import { Rect } from './Rect.js';
import { Circle } from './Circle.js';
import { Ellipse } from './Ellipse.js';
import { Line } from './Line.js';
import { Text } from './Text.js';
import { Group } from './Group.js';
import { Value } from './Value.js';

interface Definition {
  keys: readonly string[];
  style?: string;
  text?: boolean;
  make: (id: string, numbers: number[], content: string) => Shape;
}

/** The only shape-name dispatch point. Replace this table with provider registration in phase 2. */
export class ShapeFactory {
  private readonly definitions = new Map<string, Definition>([
    ['rect', { keys: ['x', 'y', 'width', 'height'], style: 'fill', make: (id, v) => new Rect(id, v[0]!, v[1]!, v[2]!, v[3]!) }],
    ['circle', { keys: ['cx', 'cy', 'r'], style: 'fill', make: (id, v) => new Circle(id, v[0]!, v[1]!, v[2]!) }],
    ['ellipse', { keys: ['cx', 'cy', 'rx', 'ry'], style: 'fill', make: (id, v) => new Ellipse(id, v[0]!, v[1]!, v[2]!, v[3]!) }],
    ['line', { keys: ['x1', 'y1', 'x2', 'y2'], style: 'stroke', make: (id, v) => new Line(id, v[0]!, v[1]!, v[2]!, v[3]!) }],
    ['text', { keys: ['x', 'y'], text: true, make: (id, v, text) => new Text(id, v[0]!, v[1]!, text) }],
    ['g', { keys: [], make: id => new Group(id) }],
  ]);
  private definition(type: string): Definition {
    const def = this.definitions.get(type);
    if (!def) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return def;
  }
  create(type: string, id: string, args: readonly string[]): Shape {
    const def = this.definition(type);
    const required = def.keys.length + (def.text ? 1 : 0);
    if (args.length < required || args.length > required + (def.style ? 1 : 0)) throw new Error(`invalid parameters for ${type}`);
    const shape = def.make(id, args.slice(0, def.keys.length).map(v => Value.number(v)), def.text ? args[def.keys.length]! : '');
    if (def.style && args[required] !== undefined) shape.set(def.style, args[required]!);
    return shape;
  }
  fromSvg(type: string, id: string, attributes: Readonly<Record<string, string>>, text: string): Shape {
    const def = this.definition(type);
    const values = def.keys.map(key => Value.number(attributes[key] ?? '0'));
    const shape = def.make(id, values, text);
    for (const [key, value] of Object.entries(attributes)) {
      if (!def.keys.includes(key) && key !== 'id' && key !== 'transform' && key !== 'data-kind') shape.importPresentation(key, value);
    }
    return shape;
  }
}
