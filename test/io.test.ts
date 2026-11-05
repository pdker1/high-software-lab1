import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { LocalFileStore } from '../src/infrastructure/LocalFileStore.js';
import { XmlSvgCodec } from '../src/infrastructure/XmlSvgCodec.js';

test('real files: atomic overwrite, missing file and unwritable destination', () => {
  const dir = mkdtempSync(join(tmpdir(), 'svg-editor-test-'));
  try {
    const store = new LocalFileStore(), path = join(dir, '中文 file.svg');
    store.write(path, 'first'); store.write(path, 'second'); assert.equal(store.read(path), 'second');
    assert.throws(() => store.read(join(dir, 'missing.svg')), /cannot read file/);
    assert.throws(() => store.write(dir, 'bad'), /cannot write file/);
    assert.deepEqual(readdirSync(dir), ['中文 file.svg']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('actual CLI accepts piped commands and writes a browser-readable SVG', () => {
  const dir = mkdtempSync(join(tmpdir(), 'svg-editor-cli-'));
  try {
    const result = spawnSync(process.execPath, [resolve('dist/src/main.js')], {
      cwd: dir, encoding: 'utf8', input: [
        '# replay', 'init 400 200', 'create g flow', 'create rect start 30 70 120 60 #4a90d9 in flow',
        'create text label 50 100 "开始" in flow', 'move flow 5 5', 'undo', 'redo', 'tree',
        'save "result file.svg"', 'undo', 'read "result file.svg"', 'show label', '',
      ].join('\n'),
    });
    assert.equal(result.status, 0, result.stderr); assert.equal(result.stderr, '');
    assert.match(result.stdout, /svg-editor 0.1/); assert.match(result.stdout, /error: undo not allowed after io command/);
    assert.match(result.stdout, /text#label  parent=g#flow/);
    const drawing = new XmlSvgCodec().decode(readFileSync(join(dir, 'result file.svg'), 'utf8')).drawing;
    assert.equal(drawing.find('label').content, '开始'); assert.equal(drawing.find('start').attributes.x, '35');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
