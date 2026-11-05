import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Fixture } from './support/Fixture.js';
import { Lexer } from '../src/cli/Lexer.js';

test('lexer supports comments, colors, quoted content, empty text and Windows paths', () => {
  const lexer = new Lexer();
  assert.deepEqual(lexer.tokenize(' # comment'), []);
  assert.deepEqual(lexer.tokenize('set t text "开始 \\"hi\\" #red"'), ['set', 't', 'text', '开始 "hi" #red']);
  assert.deepEqual(lexer.tokenize('create text t 1 2 ""'), ['create', 'text', 't', '1', '2', '']);
  assert.deepEqual(lexer.tokenize('read "C:\\Users\\a b\\x.svg"'), ['read', 'C:\\Users\\a b\\x.svg']);
  assert.throws(() => lexer.tokenize('"bad'), /unterminated/);
});

test('help works before init, other operations require a document', () => {
  const f = new Fixture();
  assert.equal(f.run('help').length, 19);
  for (const cmd of ['tree', 'show r', 'canvas', 'save x.svg', 'create g g', 'undo', 'redo']) {
    assert.deepEqual(f.run(cmd), ["error: no document. use 'init' or 'read' first"]);
  }
  assert.deepEqual(f.run('init'), ['canvas 800x600 created']);
  assert.deepEqual(f.run('canvas'), ['canvas 800x600']);
});

for (const command of [
  'create rect new 1 2 3 4 #fff in inner', 'create g new in scene', 'delete inner',
  'move scene 5 -2', 'scale scene 0.5', 'set scene fill blue', 'set a width 15',
  'set t text "中文 & < >"', 'group pair b a', 'group across a t',
  'ungroup inner', 'addto scene a', 'front a', 'back b',
]) {
  test('edit is exactly one reversible unit: ' + command, () => {
    const f = new Fixture(); f.setup(); const before = f.snapshot();
    assert.ok(!f.run(command)[0]!.startsWith('error:'), command);
    const after = f.snapshot(); assert.notEqual(before, after);
    assert.ok(!f.run('undo')[0]!.startsWith('error:')); assert.equal(f.snapshot(), before);
    assert.ok(!f.run('redo')[0]!.startsWith('error:')); assert.equal(f.snapshot(), after);
  });
}

for (const [command, error] of [
  ['create rect a 0 0 1 1', 'id already exists: a'],
  ['create box box 0 0 1 1 hi', 'unknown shape type: box (is the plugin loaded?)'],
  ['create rect r 0 0 1 1 in absent', 'no such container: absent'],
  ['create rect r 0 0 1 1 in a', 'not a container: a'],
  ['move absent 0 0', 'no such shape: absent'],
  ['scale scene 0', 'scale factor must be positive'],
  ['scale scene -1', 'scale factor must be positive'],
  ['set a id x', 'unknown attribute: id'],
  ['set a width -1', 'width must be non-negative'],
  ['group bad a inner', 'cannot group a container into its own descendant: inner'],
  ['ungroup scene', 'cannot ungroup top-level container: scene'],
  ['addto inner scene', 'cannot move a container into its own descendant: scene'],
  ['read missing.svg', 'cannot read file: missing.svg'],
] as const) {
  test('failed command preserves document and redo history: ' + command, () => {
    const f = new Fixture(); f.setup(); f.run('move a 3 4'); const moved = f.snapshot(); f.run('undo'); const before = f.snapshot();
    assert.deepEqual(f.run(command), ['error: ' + error]); assert.equal(f.snapshot(), before);
    f.run('redo'); assert.equal(f.snapshot(), moved);
  });
}

test('overflow partway through a composite edit rolls back every child', () => {
  const f = new Fixture(); f.run('init'); f.run('create g g');
  f.run('create rect r 1 2 3 4 in g'); f.run('create circle c 1e308 0 1 in g');
  const before = f.snapshot(); assert.match(f.run('scale g 2')[0]!, /^error:/); assert.equal(f.snapshot(), before);
  f.run('undo'); assert.throws(() => f.session.drawing.find('c'));
});

test('new successful edit clears redo; displays do not enter history', () => {
  const f = new Fixture(); f.setup(); f.run('move a 1 0'); f.run('undo');
  const before = f.snapshot();
  for (const command of ['tree', 'tree scene', 'show a', 'help', 'canvas', '#comment', '']) f.run(command);
  f.run('redo'); assert.notEqual(f.snapshot(), before);
  f.run('undo'); f.run('set a fill blue'); assert.deepEqual(f.run('redo'), ['error: nothing to redo']);
});

for (const command of ['init 300 200', 'read data.svg', 'save out.svg', 'canvas 500 400']) {
  test('document barrier blocks both undo and redo until a successful edit: ' + command, () => {
    const f = new Fixture(); f.setup(); f.files.put('data.svg', f.snapshot());
    f.run(command);
    for (const op of ['undo', 'redo']) assert.deepEqual(f.run(op), ['error: undo not allowed after io command']);
    f.run('create box bad'); assert.deepEqual(f.run('undo'), ['error: undo not allowed after io command']);
    f.run('create g fresh'); f.run('undo'); assert.deepEqual(f.run('undo'), ['error: nothing to undo']);
    f.run('redo'); assert.equal(f.session.drawing.find('fresh').tag, 'g');
  });
}

test('failed save/read/resize preserve document, path and history', () => {
  const f = new Fixture(); f.setup(); f.run('save original.svg'); f.run('move a 1 1');
  const before = f.snapshot(); f.files.denyWrites();
  assert.deepEqual(f.run('save bad.svg'), ['error: cannot write file: bad.svg']);
  f.files.put('invalid.svg', '<svg><rect></svg>');
  assert.match(f.run('read invalid.svg')[0]!, /^error:/);
  assert.match(f.run('canvas 100 -2')[0]!, /^error:/); assert.equal(f.snapshot(), before);
  assert.deepEqual(f.run('save'), ['error: cannot write file: original.svg']);
  assert.ok(!f.run('undo')[0]!.startsWith('error:')); assert.notEqual(f.snapshot(), before);
});

test('read path is reused by save; save-as changes it; init forgets it', () => {
  const f = new Fixture(); f.run('init'); assert.match(f.run('save')[0]!, /no file path/);
  f.run('save "a b.svg"'); f.run('create g g'); assert.match(f.run('save')[0]!, /saved to a b.svg/);
  f.run('read "a b.svg"'); assert.match(f.run('save')[0]!, /saved to a b.svg/);
  f.run('save new.svg'); assert.match(f.run('save')[0]!, /saved to new.svg/);
  f.run('init'); assert.match(f.run('save')[0]!, /no file path/);
});

test('tree includes geometry and connectors; show reports parent and text', () => {
  const f = new Fixture(); f.setup();
  assert.match(f.run('tree').join('\n'), /rect#a.*x=1 y=2 w=3 h=4.*fill=red/);
  assert.match(f.run('tree inner').join('\n'), /^g#inner\n├── rect#a/);
  assert.match(f.run('show t').join('\n'), /text#t  parent=g#scene[\s\S]*text="hello world"/);
});

test('front and back change sibling paint order only', () => {
  const f = new Fixture(); f.setup(); f.run('front a');
  assert.deepEqual(f.session.drawing.find('inner').children.map(s => s.id), ['b', 'a']);
  f.run('back a'); assert.deepEqual(f.session.drawing.find('inner').children.map(s => s.id), ['a', 'b']);
});

test('invalid numeric arguments and arity remain atomic', () => {
  const f = new Fixture(); f.setup(); const before = f.snapshot();
  for (const cmd of ['move a NaN 0', 'scale a Infinity', 'set a width 0xff', 'create circle c 0 0 -2', 'group pair a a', 'canvas 2', 'show a extra', 'undo extra', 'create g empty extra', 'set t text "bad', 'nonexistent']) {
    assert.match(f.run(cmd)[0]!, /^error:/, cmd); assert.equal(f.snapshot(), before);
  }
});
