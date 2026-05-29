import { test } from 'node:test';
import assert from 'node:assert';
import { findCoverageReport, parseCoverageReport } from '../src/coverage.js';

test('parseCoverageReport handles Istanbul JSON format', () => {
  const data = {
    total: {
      lines: { total: 100, covered: 85, pct: 85 },
      statements: { total: 120, covered: 100, pct: 83.33 },
      functions: { total: 20, covered: 18, pct: 90 },
      branches: { total: 40, covered: 32, pct: 80 }
    }
  };

  const result = parseCoverageReport(JSON.stringify(data), 'json');
  assert.strictEqual(result.percentage, 85);
  assert.strictEqual(result.format, 'Istanbul JSON');
});

test('parseCoverageReport returns null for invalid JSON', () => {
  const result = parseCoverageReport('invalid json', 'json');
  assert.strictEqual(result, null);
});

test('findCoverageReport locates coverage files', async () => {
  const result = await findCoverageReport('./tests/fixtures');
  assert.ok(result !== null);
  assert.ok(result.path.includes('coverage-final.json'));
});

test('parseCoverageReport handles LCOV format', () => {
  const lcov = `TN:
SF:/path/to/file.js
FNF:10
FNH:8
LF:100
LH:85
end_of_record`;

  const result = parseCoverageReport(lcov, 'lcov');
  assert.strictEqual(result.percentage, 85);
  assert.strictEqual(result.format, 'LCOV');
});

test('parseCoverageReport handles Go coverage format', () => {
  const goCov = `mode: set
example.com/pkg/file.go:10.2,12.3 2 1
example.com/pkg/file.go:14.2,16.3 2 1
example.com/pkg/file.go:18.2,20.3 2 0
example.com/pkg/file.go:22.2,24.3 2 1`;

  const result = parseCoverageReport(goCov, 'go');
  assert.strictEqual(result.percentage, 75); // 3 out of 4 blocks covered
  assert.strictEqual(result.format, 'Go Coverage');
});
