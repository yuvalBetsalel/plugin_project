# Project Analytics Plugin

A Claude Code plugin that analyzes source code and displays useful metrics in a beautifully formatted terminal output.

## Features

- **Lines of Code**: Total, code, comments, and blank lines with percentages
- **Comment Analysis**: Language-aware comment detection (single-line, multi-line, doc comments)
- **Test Coverage**: Reads existing coverage reports (Istanbul, LCOV, Cobertura, Go)
- **File Type Breakdown**: Visual distribution of file types with progress bars
- **Cyclomatic Complexity**: Average complexity, high-complexity file detection, top 5 most complex files
- **Beautiful Output**: ANSI-colored terminal output with visual elements
- **Intelligent Summary**: Natural language summary with actionable insights

## Supported Languages

- JavaScript / TypeScript
- Python
- Java
- Go
- Ruby
- Rust
- C / C++
- PHP

Extensible design allows easy addition of more languages.

## Usage

### In Claude Code

```
/project-stats
```

### From Command Line

```bash
node src/analyzer.js [project-path]
```

If no path is provided, analyzes the current directory.

## Output Example

```
📊 Project Analytics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project: /home/user/my-project
Analyzed: 234 files
Scan completed in 0.8s

Lines of Code
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Lines:        12,458
  Code Lines:          8,234  (66.1%)
  Comment Lines:       2,156  (17.3%)
  Blank Lines:         2,068  (16.6%)

File Types
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  JavaScript    142 files  ████████████████░░░░  78.2%
  TypeScript     28 files  ███░░░░░░░░░░░░░░░░░  15.4%

Code Complexity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Average Complexity:  4.2 per file
  High Complexity:     12 files (>10)
  
  Top 5 Most Complex:
    src/parser.js        23
    src/analyzer.js      18

Test Coverage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Overall:  78.5%  ████████████████░░░░
  
  ℹ  Coverage data from: coverage/coverage-final.json

Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your project contains 12,458 lines across 234 files, with 66% being 
executable code. Comment coverage at 17% suggests room for improvement 
in documentation. Test coverage is healthy at 78.5%. Be aware of 12 
high-complexity files that may benefit from refactoring to improve 
maintainability.
```

## Requirements

- Node.js 18+
- Claude Code (for skill invocation)

## Installation

1. Clone or copy this plugin to your Claude Code plugins directory
2. Ensure Node.js is available in your PATH
3. Run `/project-stats` in Claude Code

## How It Works

1. **File Scanning**: Recursively walks the project directory, respecting `.gitignore`
2. **Language Detection**: Identifies file types by extension
3. **Metrics Calculation**: Analyzes each file for LOC, comments, and complexity
4. **Coverage Parsing**: Searches for and parses existing coverage reports
5. **Report Generation**: Formats results with ANSI colors and visual elements

## Coverage Format Support

- Istanbul/NYC JSON (`coverage/coverage-final.json`)
- LCOV (`coverage/lcov.info`)
- Cobertura XML (`coverage.xml`)
- Go Coverage (`coverage.out`)
- Python Coverage (`.coverage`, `coverage.xml`)
- JaCoCo XML (`target/site/jacoco/jacoco.xml`)

## Performance

- Analyzes typical projects (<500 files) in under 2 seconds
- Skips binary files and large files (>1MB)
- Excludes common directories: `node_modules`, `.git`, `dist`, `build`, `coverage`

## Testing

```bash
npm test
```

## License

MIT
