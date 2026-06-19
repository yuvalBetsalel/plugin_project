import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

// Known locations where test coverage reports are typically written by common tools
const COVERAGE_LOCATIONS = [
  'coverage/coverage-final.json',  // Istanbul / NYC (JavaScript)
  'coverage/lcov.info',            // LCOV (many languages)
  '.coverage',                     // Python coverage
  'coverage.xml',                  // Cobertura XML (Java, Python)
  'coverage.out',                  // Go coverage
  'target/site/jacoco/jacoco.xml'  // JaCoCo (Java/Maven)
];

// Tries each known coverage file path in order and returns the first one found and parsed.
// Returns null if no coverage report exists in the project.
export async function findCoverageReport(rootPath) {
  for (const location of COVERAGE_LOCATIONS) {
    const fullPath = join(rootPath, location);
    try {
      await access(fullPath);
      const content = await readFile(fullPath, 'utf-8');
      const format = detectFormat(location);
      const parsed = parseCoverageReport(content, format);

      if (parsed) {
        return {
          path: location,
          ...parsed
        };
      }
    } catch (error) {
      // File doesn't exist or can't be read, try next
      continue;
    }
  }

  return null;
}

function detectFormat(filename) {
  if (filename.endsWith('.json')) return 'json';
  if (filename.includes('lcov')) return 'lcov';
  if (filename.endsWith('.xml')) return 'xml';
  if (filename === '.coverage') return 'python';
  if (filename.endsWith('.out')) return 'go';
  return 'unknown';
}

export function parseCoverageReport(content, format) {
  try {
    switch (format) {
      case 'json':
        return parseIstanbulJson(content);
      case 'lcov':
        return parseLcov(content);
      case 'xml':
        return parseCoberturaXml(content);
      case 'go':
        return parseGoCoverage(content);
      default:
        return null;
    }
  } catch (error) {
    return null;
  }
}

function parseIstanbulJson(content) {
  const data = JSON.parse(content);

  if (data.total && data.total.lines && data.total.lines.pct !== undefined) {
    return {
      percentage: data.total.lines.pct,
      format: 'Istanbul JSON'
    };
  }

  return null;
}

function parseLcov(content) {
  const lines = content.split('\n');
  let linesFound = 0;
  let linesHit = 0;

  // LF = Lines Found (total instrumented lines), LH = Lines Hit (covered lines)
  for (const line of lines) {
    if (line.startsWith('LF:')) {
      linesFound = parseInt(line.substring(3));
    } else if (line.startsWith('LH:')) {
      linesHit = parseInt(line.substring(3));
    }
  }

  if (linesFound > 0) {
    return {
      percentage: Math.round((linesHit / linesFound) * 100 * 10) / 10,
      format: 'LCOV'
    };
  }

  return null;
}

function parseCoberturaXml(content) {
  // Simple regex-based XML parsing (sufficient for coverage percentage)
  const lineRateMatch = content.match(/line-rate="([0-9.]+)"/);

  if (lineRateMatch) {
    const lineRate = parseFloat(lineRateMatch[1]);
    return {
      percentage: Math.round(lineRate * 100 * 10) / 10,
      format: 'Cobertura XML'
    };
  }

  return null;
}

function parseGoCoverage(content) {
  // Each line is: "pkg/file.go:startLine.col,endLine.col numStatements isCovered"
  // The last field is 0 (not covered) or >0 (covered)
  const lines = content.split('\n').filter(l => l && !l.startsWith('mode:'));

  if (lines.length === 0) return null;

  let covered = 0;
  let total = 0;

  for (const line of lines) {
    const parts = line.split(' ');
    if (parts.length >= 3) {
      total++;
      const isCovered = parts[parts.length - 1] !== '0';
      if (isCovered) covered++;
    }
  }

  if (total > 0) {
    return {
      percentage: Math.round((covered / total) * 100 * 10) / 10,
      format: 'Go Coverage'
    };
  }

  return null;
}
