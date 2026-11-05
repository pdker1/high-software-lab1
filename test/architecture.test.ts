import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, basename, resolve, relative } from 'node:path';
import ts from 'typescript';

test('source obeys layer dependencies, one-class-per-file and no tag switches', () => {
  const allowed: Record<string, string[]> = {
    domain: ['domain'], application: ['application', 'domain'],
    infrastructure: ['infrastructure', 'application', 'domain'], cli: ['cli', 'application'],
  };
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]);
  for (const path of walk('src').filter(path => path.endsWith('.ts'))) {
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    const layer = path.split(/[\\/]/)[1]!;
    let classCount = 0;
    const inspect = (node: ts.Node): void => {
      if (ts.isClassDeclaration(node)) { classCount++; assert.equal(node.name?.text, basename(path, '.ts'), path); }
      assert.ok(!ts.isSwitchStatement(node), `name switching must stay in factory/router maps: ${path}`);
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const specifier = node.moduleSpecifier.text;
        if (specifier.startsWith('.') && allowed[layer]) {
          const target = relative(resolve('src'), resolve(path, '..', specifier)).split(/[\\/]/)[0]!;
          assert.ok(allowed[layer]!.includes(target), `${path} -> ${specifier}`);
        }
        if (layer === 'domain' || layer === 'application') assert.ok(specifier.startsWith('.'), `core imports IO/library: ${path}`);
      }
      ts.forEachChild(node, inspect);
    };
    inspect(source); assert.ok(classCount <= 1, path);
  }
});
