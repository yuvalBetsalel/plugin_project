import { test } from 'node:test';
import assert from 'node:assert';
import { scanDirectory } from '../src/scanner.js';

test('scanDirectory finds source files', async () => {
  const files = await scanDirectory('./tests/fixtures');
  assert.ok(files.length > 0);
  assert.ok(files.some(f => f.endsWith('.js')));
});

test('scanDirectory excludes node_modules', async () => {
  const files = await scanDirectory('./tests/fixtures');
  assert.ok(!files.some(f => f.includes('node_modules')));
});

test('scanDirectory excludes .git directory', async () => {
  const files = await scanDirectory('./tests/fixtures');
  assert.ok(!files.some(f => f.includes('.git')));
});

test('scanDirectory respects .gitignore', async () => {
  const files = await scanDirectory('./tests/fixtures');
  assert.ok(!files.some(f => f.includes('ignored.txt')));
});
