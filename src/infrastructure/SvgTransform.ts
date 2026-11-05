import { Value } from '../domain/Value.js';
import type { Shape } from '../domain/Shape.js';
/** Positive uniform scaling and translation, composed in SVG matrix order. */
export class SvgTransform {
  private scaleFactor = 1;
  private dx = 0;
  private dy = 0;
  constructor(raw: string) {
    const pattern = /(?:translate\s*\(([^()]*)\)|scale\s*\(([^()]*)\))/g;
    let end = 0;
    for (const match of raw.matchAll(pattern)) {
      if (!/^[\s,]*$/.test(raw.slice(end, match.index))) throw new Error('unsupported SVG transform');
      const values = (match[1] ?? match[2]!).trim().split(/[\s,]+/).map(v => Value.number(v));
      if (values.length < 1 || values.length > 2) throw new Error('invalid SVG transform');
      if (match[1] !== undefined) { this.dx += this.scaleFactor * values[0]!; this.dy += this.scaleFactor * (values[1] ?? 0); }
      else {
        const factor = Value.positive(values[0]!, 'scale factor');
        if (values.length === 2 && values[1] !== factor) throw new Error('non-uniform SVG scale is not supported');
        this.scaleFactor *= factor;
      }
      end = match.index! + match[0].length;
    }
    if (!/^\s*$/.test(raw.slice(end))) throw new Error('unsupported SVG transform');
  }
  apply(shape: Shape): void {
    shape.scale(this.scaleFactor); shape.move(this.dx, this.dy);
    if (this.scaleFactor === 1) return;
    const scalePresentation = (node: Shape): void => {
      for (const attribute of ['font-size', 'stroke-width']) {
        const raw = node.attributes[attribute];
        if (raw !== undefined) node.importPresentation(attribute, String(Value.number(Value.number(raw.replace(/px$/, '')) * this.scaleFactor)));
      }
      const dash = node.attributes['stroke-dasharray'];
      if (dash && dash !== 'none') node.importPresentation('stroke-dasharray', dash.trim().split(/[\s,]+/).map(value => Value.number(Value.number(value.replace(/px$/, '')) * this.scaleFactor)).join(' '));
      node.children.forEach(scalePresentation);
    };
    scalePresentation(shape);
  }
}
