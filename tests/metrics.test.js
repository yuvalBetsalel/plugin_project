import { test } from 'node:test';
import assert from 'node:assert';
import { analyzeFile } from '../src/metrics.js';

const sampleJavaScript = `// Header comment
function example() {
  // Calculate sum
  const x = 1;
  const y = 2;

  return x + y;
}

/* Multi-line comment
   that spans multiple lines */
const z = 3;
`;

test('analyzeFile counts total lines', () => {
  const result = analyzeFile(sampleJavaScript, 'JavaScript');
  assert.strictEqual(result.totalLines, 13);
});

test('analyzeFile counts code lines', () => {
  const result = analyzeFile(sampleJavaScript, 'JavaScript');
  assert.strictEqual(result.codeLines, 6);
});

test('analyzeFile counts comment lines', () => {
  const result = analyzeFile(sampleJavaScript, 'JavaScript');
  assert.strictEqual(result.commentLines, 4);
});

test('analyzeFile counts blank lines', () => {
  const result = analyzeFile(sampleJavaScript, 'JavaScript');
  assert.strictEqual(result.blankLines, 3);
});
