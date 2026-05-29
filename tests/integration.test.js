import { test } from 'node:test';
import assert from 'node:assert';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

test('analyzer runs successfully on fixtures', async () => {
  const { stdout, stderr } = await execAsync('node src/analyzer.js tests/fixtures');

  assert.ok(stdout.includes('Project Analytics'));
  assert.ok(stdout.includes('Lines of Code'));
  assert.ok(stdout.includes('File Types'));
  assert.ok(stdout.includes('Code Complexity'));
  assert.ok(stdout.includes('Summary'));
  assert.strictEqual(stderr, '');
});

test('analyzer handles current directory', async () => {
  const { stdout } = await execAsync('node src/analyzer.js .');

  assert.ok(stdout.includes('Project Analytics'));
  assert.ok(stdout.length > 100);
});
