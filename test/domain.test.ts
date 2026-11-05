import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Drawing } from '../src/domain/Drawing.js';
import { ShapeFactory } from '../src/domain/ShapeFactory.js';
import { Group } from '../src/domain/Group.js';

test('all six shapes support clone, set, move and scale polymorphically', () => {
  const factory = new ShapeFactory();
  const cases = [
    ['rect', ['1', '2', '3', '4']], ['circle', ['1', '2', '3']],
    ['ellipse', ['1', '2', '3', '4']], ['line', ['1', '2', '3', '4']],
    ['text', ['1', '2', 'hello']], ['g', []],
  ] as const;
  for (const [kind, params] of cases) {
    const shape = factory.create(kind, kind, params);
    shape.set('fill', 'red'); const copy = shape.clone();
    shape.move(10, 20); shape.scale(2);
    assert.equal(copy.attributes.fill, 'red');
    assert.throws(() => shape.set('unknown', '0'), /unknown attribute/);
    assert.throws(() => shape.scale(0), /must be positive/);
    assert.equal(copy.tag, kind);
    if (kind !== 'g') assert.notDeepEqual(shape.attributes, copy.attributes);
  }
  assert.throws(() => factory.create('box', 'a', []), /unknown shape type/);
});

test('nested composite moves every descendant exactly once; clone is isolated', () => {
  const factory = new ShapeFactory(), drawing = new Drawing();
  drawing.add(new Group('outer')); drawing.add(new Group('inner'), 'outer');
  drawing.add(factory.create('rect', 'r', ['1', '2', '3', '4']), 'inner');
  const copy = drawing.clone(); drawing.find('outer').move(5, 7); drawing.find('outer').scale(2);
  assert.deepEqual(drawing.find('r').attributes, { x: '12', y: '18', width: '6', height: '8' });
  assert.equal(copy.find('r').attributes.x, '1');
});

test('group preserves document order, nested ungroup replaces exact position', () => {
  const drawing = new Drawing(), factory = new ShapeFactory(); drawing.add(new Group('scene'));
  for (const id of ['a', 'b', 'c']) drawing.add(factory.create('circle', id, ['0', '0', '1']), 'scene');
  drawing.group('pair', ['c', 'a']);
  assert.deepEqual(drawing.find('pair').children.map(s => s.id), ['a', 'c']);
  assert.deepEqual(drawing.find('scene').children.map(s => s.id), ['pair', 'b']);
  drawing.ungroup('pair'); assert.deepEqual(drawing.find('scene').children.map(s => s.id), ['a', 'c', 'b']);
  assert.throws(() => drawing.ungroup('scene'), /top-level/);
});

test('reject ancestor selection, cyclic reparenting and duplicate ids', () => {
  const drawing = new Drawing(); drawing.add(new Group('g')); drawing.add(new Group('child'), 'g');
  assert.throws(() => drawing.group('new', ['g', 'child']), /own descendant: g/);
  assert.throws(() => drawing.addTo('child', 'g'), /own descendant/);
  assert.throws(() => drawing.add(new Group('child')), /id already exists/);
  assert.deepEqual(drawing.children.map(s => s.id), ['g']);
  drawing.add(new Group('G')); assert.equal(drawing.children.length, 2);
});

test('geometry rejects NaN, infinity and negative sizes', () => {
  const factory = new ShapeFactory();
  for (const raw of ['NaN', 'Infinity', '1e999', '0xff', '', '-2']) assert.throws(() => factory.create('circle', 'c', ['0', '0', raw]));
  const line = factory.create('line', 'l', ['-1', '2', '-3', '4']); line.move(0.5, -0.5);
  assert.equal(line.attributes.x1, '-0.5');
});
