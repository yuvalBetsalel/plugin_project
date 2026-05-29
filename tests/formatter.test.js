import { test } from 'node:test';
import assert from 'node:assert';
import { formatReport } from '../src/formatter.js';

test('formatReport generates header section', () => {
  const data = {
    projectPath: '/test/project',
    fileCount: 50,
    scanTime: 0.5,
    metrics: {
      totalLines: 1000,
      codeLines: 600,
      commentLines: 200,
      blankLines: 200
    },
    fileTypes: {},
    complexity: { average: 5, highComplexityFiles: [], topComplex: [] },
    coverage: null
  };

  const output = formatReport(data);
  assert.ok(output.includes('Project Analytics'));
  assert.ok(output.includes('/test/project'));
  assert.ok(output.includes('50 files'));
});

test('formatReport generates metrics section', () => {
  const data = {
    projectPath: '/test/project',
    fileCount: 50,
    scanTime: 0.5,
    metrics: {
      totalLines: 1000,
      codeLines: 600,
      commentLines: 200,
      blankLines: 200
    },
    fileTypes: {},
    complexity: { average: 5, highComplexityFiles: [], topComplex: [] },
    coverage: null
  };

  const output = formatReport(data);
  assert.ok(output.includes('Lines of Code'));
  assert.ok(output.includes('1,000'));
  assert.ok(output.includes('600'));
  assert.ok(output.includes('60.0%'));
});

test('formatReport generates file type breakdown with bars', () => {
  const data = {
    projectPath: '/test/project',
    fileCount: 100,
    scanTime: 0.5,
    metrics: { totalLines: 1000, codeLines: 600, commentLines: 200, blankLines: 200 },
    fileTypes: {
      'JavaScript': 70,
      'TypeScript': 20,
      'JSON': 10
    },
    complexity: { average: 5, highComplexityFiles: [], topComplex: [] },
    coverage: null
  };

  const output = formatReport(data);
  assert.ok(output.includes('JavaScript'));
  assert.ok(output.includes('70 files'));
  assert.ok(output.includes('█')); // Progress bar
});

test('formatReport generates complexity with top files', () => {
  const data = {
    projectPath: '/test/project',
    fileCount: 50,
    scanTime: 0.5,
    metrics: { totalLines: 1000, codeLines: 600, commentLines: 200, blankLines: 200 },
    fileTypes: {},
    complexity: {
      average: 8.5,
      highComplexityFiles: [{ path: 'src/complex.js', complexity: 25 }],
      topComplex: [
        { path: 'src/parser.js', complexity: 23 },
        { path: 'src/analyzer.js', complexity: 18 }
      ]
    },
    coverage: null
  };

  const output = formatReport(data);
  assert.ok(output.includes('8.5 per file'));
  assert.ok(output.includes('1 files (>10)'));
  assert.ok(output.includes('src/parser.js'));
  assert.ok(output.includes('23'));
});

test('formatReport generates coverage with progress bar', () => {
  const data = {
    projectPath: '/test/project',
    fileCount: 50,
    scanTime: 0.5,
    metrics: { totalLines: 1000, codeLines: 600, commentLines: 200, blankLines: 200 },
    fileTypes: {},
    complexity: { average: 5, highComplexityFiles: [], topComplex: [] },
    coverage: {
      percentage: 78.5,
      format: 'Istanbul JSON',
      path: 'coverage/coverage-final.json'
    }
  };

  const output = formatReport(data);
  assert.ok(output.includes('78.5%'));
  assert.ok(output.includes('█')); // Progress bar
  assert.ok(output.includes('coverage/coverage-final.json'));
});
