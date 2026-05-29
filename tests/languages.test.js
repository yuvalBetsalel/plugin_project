import { test } from 'node:test';
import assert from 'node:assert';
import { detectLanguage, getLanguageConfig } from '../src/languages.js';

test('detectLanguage identifies JavaScript files', () => {
  assert.strictEqual(detectLanguage('app.js'), 'JavaScript');
  assert.strictEqual(detectLanguage('test.jsx'), 'JavaScript');
});

test('detectLanguage identifies TypeScript files', () => {
  assert.strictEqual(detectLanguage('app.ts'), 'TypeScript');
  assert.strictEqual(detectLanguage('component.tsx'), 'TypeScript');
});

test('detectLanguage identifies Python files', () => {
  assert.strictEqual(detectLanguage('script.py'), 'Python');
});

test('detectLanguage returns null for unknown extensions', () => {
  assert.strictEqual(detectLanguage('image.png'), null);
  assert.strictEqual(detectLanguage('data.bin'), null);
});

test('getLanguageConfig returns JavaScript config', () => {
  const config = getLanguageConfig('JavaScript');
  assert.ok(config);
  assert.ok(config.singleLineComment);
  assert.ok(config.multiLineComment);
  assert.ok(config.complexityKeywords);
});
