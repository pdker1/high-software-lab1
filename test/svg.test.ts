import { test } from 'node:test';
import assert from 'node:assert/strict';
import { XmlSvgCodec } from '../src/infrastructure/XmlSvgCodec.js';
import { Fixture } from './support/Fixture.js';

test('all six shape types, styles, order and escaped Unicode text round-trip', () => {
  const f = new Fixture(); f.setup(); f.run('create ellipse e 1.5 -2 3 4 #ff00ff in scene');
  f.run('set t text "中文 & <tag> \\"quoted\\""');
  f.run('set a stroke-width 1.5'); f.run('set a stroke black');
  const xml = f.snapshot(); const decoded = f.codec.decode(xml);
  assert.equal(f.codec.encode(decoded.drawing), xml); assert.deepEqual(decoded.warnings, []);
  assert.ok(xml.includes('&amp;')); assert.ok(xml.includes('&lt;tag&gt;'));
  assert.equal(decoded.drawing.find('t').content, '中文 & <tag> "quoted"');
  assert.equal(decoded.drawing.find('b').attributes.fill, undefined);
});

test('missing ids are assigned after reserving explicit ids throughout the file', () => {
  const codec = new XmlSvgCodec();
  const result = codec.decode('<svg width="400" height="300"><rect/><g><rect id="rect1"/><rect/><circle/></g></svg>');
  assert.deepEqual(result.warnings, [
    'warning: assigned id rect2 to unnamed <rect>', 'warning: assigned id g1 to unnamed <g>',
    'warning: assigned id rect3 to unnamed <rect>', 'warning: assigned id circle1 to unnamed <circle>',
  ]);
  assert.deepEqual(result.drawing.all().map(s => s.id), ['rect2', 'g1', 'rect1', 'rect3', 'circle1']);
  assert.deepEqual(codec.decode(codec.encode(result.drawing)).warnings, []);
});

test('g data-kind is imported as an ordinary editable group with a warning', () => {
  const result = new XmlSvgCodec().decode('<svg><g id="n" data-kind="box"><rect id="n-r"/></g></svg>');
  assert.equal(result.drawing.find('n').tag, 'g'); assert.match(result.warnings[0]!, /ordinary g/);
  result.drawing.find('n').move(10, 20); assert.equal(result.drawing.find('n-r').attributes.x, '10');
});

test('nested translate and uniform scale are composed in SVG order', () => {
  const result = new XmlSvgCodec().decode('<svg><g id="a" transform="translate(60,40)"><g id="b" transform="translate(200,0) scale(0.8)"><rect id="r" x="10" y="20" width="120" height="60"/></g></g></svg>');
  assert.deepEqual(result.drawing.find('r').attributes, { x: '268', y: '56', width: '96', height: '48' });
  const other = new XmlSvgCodec().decode('<svg><rect id="r" transform="scale(2) translate(3,4)"/></svg>');
  assert.equal(other.drawing.find('r').attributes.x, '6'); assert.equal(other.drawing.find('r').attributes.y, '8');
});

test('common text presentation attributes survive import and export', () => {
  const codec = new XmlSvgCodec();
  const result = codec.decode('<svg><text id="t" font-size="16" text-anchor="middle" fill="white"><![CDATA[A & B]]></text></svg>');
  assert.equal(result.drawing.find('t').content, 'A & B');
  assert.equal(codec.decode(codec.encode(result.drawing)).drawing.find('t').attributes['text-anchor'], 'middle');
});

test('flattened transforms preserve inherited text size and stroke widths', () => {
  const codec = new XmlSvgCodec();
  const result = codec.decode('<svg font-size="20" stroke="black" opacity="0.5"><g id="g" transform="scale(2)"><g id="i" transform="scale(0.5)"><text id="t" x="1" y="2">hello</text></g><line id="l"/></g></svg>');
  assert.equal(result.drawing.find('t').attributes['font-size'], '20');
  assert.equal(result.drawing.find('t').attributes['stroke-width'], '1');
  assert.equal(result.drawing.find('l').attributes['stroke-width'], '2');
  assert.equal(result.drawing.presentation.opacity, '0.5');
  assert.equal(result.drawing.find('g').attributes.opacity, undefined);
  assert.equal(codec.encode(result.drawing.clone()), codec.encode(result.drawing));
});

for (const xml of [
  '<svg><rect id="a"/><g id="a"/></svg>', '<svg><rect></svg>', '<svg/><svg/>',
  '<html/>', '<svg><path id="p" d="M0 0"/></svg>', '<svg><rect id="r" width="NaN"/></svg>',
  '<svg><rect id="r" width="-1"/></svg>', '<svg><text id="t"><tspan>hi</tspan></text></svg>',
  '<!DOCTYPE svg [<!ENTITY a "value">]><svg/>', '<svg><rect id="r" onclick="alert(1)"/></svg>',
  '<svg width="200" height="100" viewBox="0 0 400 200"/>', '<svg><g id="g" transform="rotate(45)"/></svg>',
  '<svg><rect id="r" transform="scale(2,3)"/></svg>', '<svg>stray text</svg>',
  '<svg><g id="g">unexpected</g></svg>', '<svg xmlns="urn:wrong"/>',
]) {
  test('unsupported or malformed input fails atomically: ' + xml, () => {
    const f = new Fixture(); f.setup(); f.files.put('bad.svg', xml); const before = f.snapshot();
    assert.match(f.run('read bad.svg')[0]!, /^error:/); assert.equal(f.snapshot(), before);
    assert.ok(!f.run('undo')[0]!.startsWith('error:'));
  });
}
