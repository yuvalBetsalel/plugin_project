# Project Analytics Plugin

A Claude Code plugin that analyzes your source code and displays metrics directly in the terminal — lines of code, file types, complexity and test coverage.

## Installation

### One-Time Setup

1. Open Claude Code in any folder
2. Add the plugin marketplace source. Run:
   ```
   /plugin marketplace add yuvalBetsalel/plugin_project
   ```
3. Install the plugin. Run:
   ```
   /plugin install claude-code-project-analytics@project-analytics-marketplace
   ```

That's it — you only need to do this once.

### Daily Usage

1. Navigate to the project folder you want to analyze
2. Open Claude Code:
   ```bash
   claude
   ```
3. Run the plugin:
   ```
   /project-stats
   ```

Results appear directly in your terminal.

## What It Analyzes

- **Lines of Code** — total, code, comments, and blank lines with percentages
- **File Types** — visual breakdown of languages used in the project
- **Cyclomatic Complexity** — average complexity, high-complexity file detection, top 5 most complex files
- **Test Coverage** — reads existing coverage reports if present

## Supported Languages

JavaScript, TypeScript, Python, Java, Go, Ruby, Rust, C, C++, PHP

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

Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your project contains 12,458 lines across 234 files, with 66% being
executable code. Comment coverage at 17% suggests room for improvement
in documentation. Test coverage is healthy at 78.5%. Be aware of 12
high-complexity files that may benefit from refactoring.
```

## How It Works

1. Recursively scans the project directory
2. Detects file types by extension
3. Analyzes each file for lines of code, comments, and cyclomatic complexity
4. Searches for and parses existing test coverage reports
5. Formats and displays results in the terminal

## Coverage Format Support

Istanbul/NYC, LCOV, Cobertura XML, Go Coverage, Python Coverage, JaCoCo XML

## Requirements

- Node.js 18+
- Claude Code


