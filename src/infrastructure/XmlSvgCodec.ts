import { DOMParser, XMLSerializer, DOMImplementation } from '@xmldom/xmldom';
import type { SvgCodec } from '../application/ports.js';
import { Drawing } from '../domain/Drawing.js';
import { ShapeFactory } from '../domain/ShapeFactory.js';
import { Group } from '../domain/Group.js';
import type { Shape } from '../domain/Shape.js';
import { Value } from '../domain/Value.js';
import { SvgTransform } from './SvgTransform.js';

export class XmlSvgCodec implements SvgCodec {
  private readonly namespace = 'http://www.w3.org/2000/svg';
  private readonly factory = new ShapeFactory();
  decode(xml: string): { drawing: Drawing; warnings: string[] } {
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('unsupported SVG document type or entity');
    const fail = (): never => { throw new Error('invalid SVG XML'); };
    const document = new DOMParser({ errorHandler: { warning: fail, error: fail, fatalError: fail } }).parseFromString(xml, 'image/svg+xml');
    const root = document.documentElement;
    if (!root || root.localName !== 'svg' || (root.namespaceURI && root.namespaceURI !== this.namespace)) throw new Error('expected SVG root element');
    for (let i = 0; i < document.childNodes.length; i++) {
      const node = document.childNodes.item(i)!;
      if (node.nodeType === 3 && node.nodeValue?.trim()) throw new Error('invalid content outside SVG root');
      if (node.nodeType === 1 && node !== root) throw new Error('multiple SVG roots');
    }
    const dimension = (name: string, fallback: number): number => {
      const raw = root.getAttribute(name);
      return raw ? Value.positive(raw.replace(/px$/, ''), 'canvas ' + name) : fallback;
    };
    const viewBox = root.getAttribute('viewBox');
    const view = viewBox ? viewBox.trim().split(/[\s,]+/).map(v => Value.number(v)) : undefined;
    if (view && (view.length !== 4 || view[0] !== 0 || view[1] !== 0)) throw new Error('only a zero-origin SVG viewBox is supported');
    const drawing = new Drawing(dimension('width', view?.[2] ?? 800), dimension('height', view?.[3] ?? 600));
    if (view && (view[2] !== drawing.width || view[3] !== drawing.height)) throw new Error('SVG viewBox must match canvas dimensions');
    const warnings: string[] = [], reserved = new Set<string>();
    // Reserve every explicit id before allocating any missing id, including later siblings.
    const elements = root.getElementsByTagName('*');
    if (root.getAttribute('id')) reserved.add(root.getAttribute('id')!);
    for (let i = 0; i < elements.length; i++) {
      const id = elements.item(i)!.getAttribute('id');
      if (id) { Value.id(id); if (reserved.has(id)) throw new Error('id already exists: ' + id); reserved.add(id); }
    }
    const children = (element: Element): Element[] => {
      const result: Element[] = [];
      for (let i = 0; i < element.childNodes.length; i++) {
        const node = element.childNodes.item(i)!;
        if (node.nodeType === 1) result.push(node as Element);
      }
      return result;
    };
    const parse = (element: Element): Shape => {
      if (element.namespaceURI && element.namespaceURI !== this.namespace) throw new Error('unsupported SVG namespace');
      const type = element.localName || element.tagName;
      let id = element.getAttribute('id');
      if (!id) {
        let n = 1; while (reserved.has(type + n)) n++;
        id = type + n; reserved.add(id); warnings.push('warning: assigned id ' + id + ' to unnamed <' + type + '>');
      }
      const attributes: Record<string, string> = {};
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes.item(i)!;
        if (attr.name !== 'xmlns') attributes[attr.name] = attr.value;
      }
      const shape = this.factory.fromSvg(type, id, attributes, element.textContent ?? '');
      const nested = children(element);
      if (shape instanceof Group) {
        for (let i = 0; i < element.childNodes.length; i++) {
          const node = element.childNodes.item(i)!;
          if (node.nodeType === 3 && node.nodeValue?.trim()) throw new Error('unexpected text inside SVG container');
        }
        nested.forEach(child => shape.insert(parse(child)));
      } else if (nested.length) throw new Error('nested elements in SVG leaf are not supported');
      else if (shape.content === undefined && element.textContent?.trim()) throw new Error('unexpected text inside SVG shape');
      // Before flattening a scale, make inherited text/stroke lengths explicit on leaves.
      // Inner and outer transforms subsequently scale these lengths once each.
      if (!(shape instanceof Group)) {
        const ancestors: Element[] = [];
        for (let current: Node | null = element; current?.nodeType === 1; current = current.parentNode) ancestors.push(current as Element);
        if (ancestors.some(ancestor => /scale\s*\(/.test(ancestor.getAttribute('transform') ?? ''))) {
          const inheritedValue = (key: string): string | undefined => ancestors.find(ancestor => ancestor.hasAttribute(key))?.getAttribute(key) ?? undefined;
          if (shape.content !== undefined) shape.importPresentation('font-size', inheritedValue('font-size') ?? '16');
          if ((inheritedValue('stroke') ?? 'none') !== 'none') shape.importPresentation('stroke-width', inheritedValue('stroke-width') ?? '1');
          const dash = inheritedValue('stroke-dasharray');
          if (dash) shape.importPresentation('stroke-dasharray', dash);
        }
      }
      if (attributes['data-kind']) warnings.push('warning: imported ' + id + ' as ordinary ' + type + ' (plugin metadata ignored)');
      if (attributes.transform) new SvgTransform(attributes.transform).apply(shape);
      return shape;
    };
    const rootStyles: Record<string, string> = {};
    for (let i = 0; i < root.attributes.length; i++) {
      const attr = root.attributes.item(i)!;
      if (!['xmlns', 'version', 'id', 'width', 'height', 'viewBox'].includes(attr.name)) rootStyles[attr.name] = attr.value;
    }
    // Keep root presentation on the root: opacity, in particular, is compositing state.
    for (const [key, value] of Object.entries(rootStyles)) drawing.setPresentation(key, value);
    for (let i = 0; i < root.childNodes.length; i++) {
      const node = root.childNodes.item(i)!;
      if (node.nodeType === 3 && node.nodeValue?.trim()) throw new Error('unexpected text inside SVG root');
    }
    children(root).forEach(element => {
      const shape = parse(element);
      drawing.add(shape);
    });
    return { drawing, warnings };
  }
  encode(drawing: Drawing): string {
    const document = new DOMImplementation().createDocument(this.namespace, 'svg', null);
    const root = document.documentElement;
    root.setAttribute('xmlns', this.namespace); root.setAttribute('width', String(drawing.width)); root.setAttribute('height', String(drawing.height));
    root.setAttribute('viewBox', '0 0 ' + drawing.width + ' ' + drawing.height);
    for (const [key, value] of Object.entries(drawing.presentation)) root.setAttribute(key, value);
    const append = (shape: Shape, parent: Element): void => {
      const element = document.createElementNS(this.namespace, shape.tag);
      element.setAttribute('id', shape.id);
      for (const [key, value] of Object.entries(shape.attributes)) element.setAttribute(key, value);
      if (shape.content !== undefined) element.appendChild(document.createTextNode(shape.content));
      parent.appendChild(element); shape.children.forEach(child => append(child, element));
    };
    drawing.children.forEach(shape => append(shape, root));
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(document) + '\n';
  }
}
