#!/usr/bin/env node

import { scanDirectory } from './scanner.js';
import { detectLanguage } from './languages.js';
import { analyzeFile } from './metrics.js';
import { findCoverageReport } from './coverage.js';
import { formatReport } from './formatter.js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function analyze(projectPath) {
  const startTime = Date.now();
  const absolutePath = resolve(projectPath);

  // Scan directory
  const files = await scanDirectory(absolutePath);

  // Initialize aggregates
  const metrics = {
    totalLines: 0,
    codeLines: 0,
    commentLines: 0,
    blankLines: 0
  };

  const fileTypes = {};
  const complexityScores = [];

  // Analyze each file
  for (const filePath of files) {
    const language = detectLanguage(filePath);
    if (!language) continue;

    // Track file types
    fileTypes[language] = (fileTypes[language] || 0) + 1;

    try {
      const content = await readFile(filePath, 'utf-8');

      // Skip very large files
      if (content.length > 1_000_000) continue;

      const fileMetrics = analyzeFile(content, language);

      // Aggregate metrics
      metrics.totalLines += fileMetrics.totalLines;
      metrics.codeLines += fileMetrics.codeLines;
      metrics.commentLines += fileMetrics.commentLines;
      metrics.blankLines += fileMetrics.blankLines;

      // Track complexity
      complexityScores.push({
        path: filePath.substring(absolutePath.length + 1),
        complexity: fileMetrics.complexity
      });
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }

  // Calculate complexity stats
  const avgComplexity = complexityScores.length > 0
    ? complexityScores.reduce((sum, f) => sum + f.complexity, 0) / complexityScores.length
    : 0;

  const highComplexityFiles = complexityScores.filter(f => f.complexity > 10);
  const topComplex = complexityScores
    .sort((a, b) => b.complexity - a.complexity)
    .slice(0, 5);

  // Find coverage
  const coverage = await findCoverageReport(absolutePath);

  const scanTime = ((Date.now() - startTime) / 1000).toFixed(1);

  return {
    projectPath: absolutePath,
    fileCount: files.length,
    scanTime,
    metrics,
    fileTypes,
    complexity: {
      average: avgComplexity,
      highComplexityFiles,
      topComplex
    },
    coverage
  };
}

// CLI entry point
import { fileURLToPath } from 'node:url';
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    fileURLToPath(import.meta.url) === process.argv[1]) {
  const projectPath = process.argv[2] || '.';

  try {
    const result = await analyze(projectPath);
    const report = formatReport(result);
    console.log(report);
  } catch (error) {
    console.error('Error analyzing project:', error.message);
    process.exit(1);
  }
}
