import { getLanguageConfig } from './languages.js';

export function analyzeFile(content, language) {
  const config = getLanguageConfig(language);
  if (!config) {
    return { totalLines: 0, codeLines: 0, commentLines: 0, blankLines: 0, complexity: 0 };
  }

  const lines = content.split('\n');
  let totalLines = lines.length;
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let complexity = 1; // Base complexity

  let inMultiLineComment = false;
  let multiLineEnd = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Blank line
    if (trimmed === '') {
      blankLines++;
      continue;
    }

    // Check for multi-line comment start/end
    if (config.multiLineComment && trimmed.includes(config.multiLineComment.start)) {
      inMultiLineComment = true;
      multiLineEnd = config.multiLineComment.end;
      commentLines++;

      // Check if comment ends on same line
      if (trimmed.includes(multiLineEnd)) {
        inMultiLineComment = false;
      }
      continue;
    }

    if (inMultiLineComment) {
      commentLines++;
      if (trimmed.includes(multiLineEnd)) {
        inMultiLineComment = false;
      }
      continue;
    }

    // Single-line comment
    const singleComment = Array.isArray(config.singleLineComment)
      ? config.singleLineComment[0]
      : config.singleLineComment;

    if (trimmed.startsWith(singleComment)) {
      commentLines++;
      continue;
    }

    // Code line - calculate complexity
    codeLines++;
    complexity += calculateLineComplexity(line, config.complexityKeywords);
  }

  return {
    totalLines,
    codeLines,
    commentLines,
    blankLines,
    complexity
  };
}

function calculateLineComplexity(line, keywords) {
  let count = 0;

  for (const keyword of keywords) {
    // Use word boundaries for keywords that are words
    if (/^[a-zA-Z]+$/.test(keyword)) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = line.match(regex);
      if (matches) {
        count += matches.length;
      }
    } else {
      // For operators like &&, ||, ?
      const matches = line.split(keyword).length - 1;
      count += matches;
    }
  }

  return count;
}
