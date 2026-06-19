// Per-language configuration used by the metrics module.
// Each entry defines how to identify comments and which keywords increase cyclomatic complexity.
const LANGUAGE_CONFIGS = {
  JavaScript: {
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
    singleLineComment: '//',
    multiLineComment: { start: '/*', end: '*/' },
    docComment: { start: '/**', end: '*/' },
    complexityKeywords: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '&&', '||', '?']
  },
  TypeScript: {
    extensions: ['.ts', '.tsx'],
    singleLineComment: '//',
    multiLineComment: { start: '/*', end: '*/' },
    docComment: { start: '/**', end: '*/' },
    complexityKeywords: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '&&', '||', '?']
  },
  Python: {
    extensions: ['.py'],
    singleLineComment: '#',
    multiLineComment: { start: '"""', end: '"""' },
    docComment: { start: "'''", end: "'''" },
    complexityKeywords: ['if', 'elif', 'else', 'for', 'while', 'except', 'and', 'or']
  },
  Java: {
    extensions: ['.java'],
    singleLineComment: '//',
    multiLineComment: { start: '/*', end: '*/' },
    docComment: { start: '/**', end: '*/' },
    complexityKeywords: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '&&', '||', '?']
  },
  Go: {
    extensions: ['.go'],
    singleLineComment: '//',
    multiLineComment: { start: '/*', end: '*/' },
    complexityKeywords: ['if', 'else', 'for', 'switch', 'case', 'select', '&&', '||']
  },
  Ruby: {
    extensions: ['.rb'],
    singleLineComment: '#',
    multiLineComment: { start: '=begin', end: '=end' },
    complexityKeywords: ['if', 'elsif', 'else', 'for', 'while', 'until', 'case', 'when', 'rescue', 'and', 'or', '?']
  },
  Rust: {
    extensions: ['.rs'],
    singleLineComment: '//',
    multiLineComment: { start: '/*', end: '*/' },
    docComment: { start: '///', end: null },
    complexityKeywords: ['if', 'else', 'for', 'while', 'loop', 'match', '&&', '||', '?']
  },
  'C/C++': {
    extensions: ['.c', '.cpp', '.cc', '.cxx', '.h', '.hpp'],
    singleLineComment: '//',
    multiLineComment: { start: '/*', end: '*/' },
    complexityKeywords: ['if', 'else', 'for', 'while', 'do', 'switch', 'case', 'catch', '&&', '||', '?']
  },
  PHP: {
    extensions: ['.php'],
    singleLineComment: ['//', '#'],
    multiLineComment: { start: '/*', end: '*/' },
    complexityKeywords: ['if', 'elseif', 'else', 'for', 'foreach', 'while', 'do', 'switch', 'case', 'catch', '&&', '||', '?']
  }
};

export function detectLanguage(filename) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();

  for (const [language, config] of Object.entries(LANGUAGE_CONFIGS)) {
    if (config.extensions.includes(ext)) {
      return language;
    }
  }

  return null;
}

export function getLanguageConfig(language) {
  return LANGUAGE_CONFIGS[language] || null;
}

export function getAllLanguages() {
  return Object.keys(LANGUAGE_CONFIGS);
}
