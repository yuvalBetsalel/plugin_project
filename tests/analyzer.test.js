import { test } from 'node:test';
import assert from 'node:assert';
import { analyze } from '../src/analyzer.js';

test('analyze orchestrates full analysis', async () => {
  const result = await analyze('./tests/fixtures');

  assert.ok(result.projectPath);
  assert.ok(result.fileCount >= 0);
  assert.ok(result.metrics);
  assert.ok(result.metrics.totalLines >= 0);
  assert.ok(result.fileTypes);
  assert.ok(result.complexity);
});

test('analyze calculates correct aggregates', async () => {
  const result = await analyze('./tests/fixtures');

  // Should have test fixtures
  assert.ok(result.fileCount > 0);
  assert.ok(result.metrics.totalLines > 0);
});
