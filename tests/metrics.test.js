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

const complexCode = `function complex(x) {
  if (x > 0) {
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0 && i > 5) {
        switch (i) {
          case 6:
            return i;
          case 8:
            return i * 2;
        }
      }
    }
  } else if (x < 0) {
    while (x < 10) {
      x++;
    }
  }
  return x;
}`;

test('analyzeFile calculates cyclomatic complexity', () => {
  const result = analyzeFile(complexCode, 'JavaScript');
  // Base complexity: 1
  // if: +1, for: +1, if: +1, &&: +1, switch: +1, case 6: +1, case 8: +1, else: +1, if: +1, while: +1
  // Total: 11
  assert.strictEqual(result.complexity, 11);
});

test('analyzeFile handles zero complexity', () => {
  const simple = 'const x = 1;\nconst y = 2;';
  const result = analyzeFile(simple, 'JavaScript');
  assert.strictEqual(result.complexity, 1); // Base complexity is 1
});
