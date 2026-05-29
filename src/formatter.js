// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

const DIVIDER = '━'.repeat(45);

export function formatReport(data) {
  const sections = [];

  sections.push(formatHeader(data));
  sections.push(formatMetrics(data.metrics));
  sections.push(formatFileTypes(data.fileTypes));
  sections.push(formatComplexity(data.complexity));

  if (data.coverage) {
    sections.push(formatCoverage(data.coverage));
  }

  sections.push(formatSummary(data));

  return sections.join('\n\n');
}

function formatHeader(data) {
  return `${colors.cyan}${colors.bright}📊 Project Analytics${colors.reset}
${colors.gray}${DIVIDER}${colors.reset}
Project: ${data.projectPath}
Analyzed: ${data.fileCount} files
Scan completed in ${data.scanTime}s`;
}

function formatMetrics(metrics) {
  const codePercent = ((metrics.codeLines / metrics.totalLines) * 100).toFixed(1);
  const commentPercent = ((metrics.commentLines / metrics.totalLines) * 100).toFixed(1);
  const blankPercent = ((metrics.blankLines / metrics.totalLines) * 100).toFixed(1);

  return `${colors.cyan}Lines of Code${colors.reset}
${colors.gray}${DIVIDER}${colors.reset}
  Total Lines:        ${formatNumber(metrics.totalLines)}
  Code Lines:         ${formatNumber(metrics.codeLines)}  ${colors.dim}(${codePercent}%)${colors.reset}
  Comment Lines:      ${formatNumber(metrics.commentLines)}  ${colors.dim}(${commentPercent}%)${colors.reset}
  Blank Lines:        ${formatNumber(metrics.blankLines)}  ${colors.dim}(${blankPercent}%)${colors.reset}`;
}

function formatFileTypes(fileTypes) {
  const entries = Object.entries(fileTypes).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (entries.length === 0) {
    return `${colors.cyan}File Types${colors.reset}
${colors.gray}${DIVIDER}${colors.reset}
  No source files found`;
  }

  const lines = entries.slice(0, 10).map(([type, count]) => {
    const percent = ((count / total) * 100).toFixed(1);
    const bar = createProgressBar(count / total);
    return `  ${type.padEnd(15)} ${count.toString().padStart(3)} files  ${bar}  ${percent}%`;
  });

  return `${colors.cyan}File Types${colors.reset}
${colors.gray}${DIVIDER}${colors.reset}
${lines.join('\n')}`;
}

function formatComplexity(complexity) {
  let output = `${colors.cyan}Code Complexity${colors.reset}
${colors.gray}${DIVIDER}${colors.reset}
  Average Complexity:  ${complexity.average.toFixed(1)} per file`;

  if (complexity.highComplexityFiles.length > 0) {
    const color = complexity.highComplexityFiles.length > 10 ? colors.red : colors.yellow;
    output += `\n  High Complexity:     ${color}${complexity.highComplexityFiles.length} files (>10)${colors.reset}`;
  }

  if (complexity.topComplex.length > 0) {
    output += '\n\n  Top 5 Most Complex:';
    complexity.topComplex.forEach(file => {
      const shortPath = file.path.length > 40 ? '...' + file.path.slice(-37) : file.path;
      output += `\n    ${shortPath.padEnd(42)} ${file.complexity}`;
    });
  }

  return output;
}

function formatCoverage(coverage) {
  const bar = createProgressBar(coverage.percentage / 100);
  const color = coverage.percentage >= 80 ? colors.green :
                coverage.percentage >= 60 ? colors.yellow : colors.red;

  return `${colors.cyan}Test Coverage${colors.reset}
${colors.gray}${DIVIDER}${colors.reset}
  Overall:  ${color}${coverage.percentage}%${colors.reset}  ${bar}

  ${colors.dim}ℹ  Coverage data from: ${coverage.path}${colors.reset}`;
}

function formatSummary(data) {
  const codePercent = Math.round((data.metrics.codeLines / data.metrics.totalLines) * 100);
  const commentPercent = Math.round((data.metrics.commentLines / data.metrics.totalLines) * 100);

  let summary = `Your project contains ${formatNumber(data.metrics.totalLines)} lines across ${data.fileCount} files, with ${codePercent}% being executable code. `;

  if (commentPercent < 15) {
    summary += `Comment coverage at ${commentPercent}% suggests room for improvement in documentation. `;
  } else if (commentPercent > 30) {
    summary += `Comment coverage at ${commentPercent}% is excellent. `;
  } else {
    summary += `Comment coverage at ${commentPercent}% is reasonable. `;
  }

  if (data.coverage) {
    if (data.coverage.percentage >= 80) {
      summary += `Test coverage is healthy at ${data.coverage.percentage}%. `;
    } else if (data.coverage.percentage >= 60) {
      summary += `Test coverage at ${data.coverage.percentage}% could be improved. `;
    } else {
      summary += `Test coverage at ${data.coverage.percentage}% needs attention. `;
    }
  }

  if (data.complexity.highComplexityFiles.length > 0) {
    summary += `Be aware of ${data.complexity.highComplexityFiles.length} high-complexity files that may benefit from refactoring to improve maintainability.`;
  }

  return `${colors.cyan}Summary${colors.reset}
${colors.gray}${DIVIDER}${colors.reset}
${summary}`;
}

function createProgressBar(percentage, width = 20) {
  const filled = Math.round(percentage * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
