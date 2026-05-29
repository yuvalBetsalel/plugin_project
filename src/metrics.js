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

    // Code line
    codeLines++;
  }

  return {
    totalLines,
    codeLines,
    commentLines,
    blankLines,
    complexity: 0 // Will implement in next task
  };
}
