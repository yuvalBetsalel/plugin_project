# Project Analytics Plugin Design

**Date:** 2026-05-29  
**Purpose:** Local utility plugin that analyzes source files and displays useful development metrics within Claude Code CLI

## Overview

A Claude Code plugin that provides developers with instant project insights: lines of code, comment density, test coverage, file type breakdown, and complexity metrics. The tool analyzes the current project directory and presents a beautifully formatted report in the terminal.

## Architecture

### Components

**1. Plugin Skill** (`project-stats.md`)
- Claude Code skill that defines the `/project-stats` command
- Invokes analyzer via Bash tool
- Passes current working directory to the analyzer

**2. Analyzer Script** (`src/analyzer.js`)
- Standalone Node.js script (no external dependencies)
- Performs all file scanning and metric calculation
- Outputs formatted results to stdout

**3. Language Configuration** (`src/languages.js`)
- Language-specific rules for comment detection
- File extension mappings
- Complexity keyword patterns per language

**4. Report Formatter** (`src/formatter.js`)
- Generates ANSI-colored terminal output
- Creates visual elements (tables, progress bars, dividers)
- Formats numbers with proper separators and percentages

### Supported Languages

Initial support for:
- JavaScript/TypeScript
- Python
- Java
- Go
- Ruby
- Rust
- C/C++
- PHP

Extensible design allows easy addition of more languages.

## Data Flow

1. **Invocation**: User runs `/project-stats` in Claude Code
2. **Scanning**: Analyzer recursively walks project directory
   - Respects `.gitignore` patterns
   - Excludes common directories: `node_modules`, `vendor`, `.git`, `dist`, `build`, `coverage`
   - Filters out binary files and media assets
3. **Analysis**: For each source file:
   - Detect language from file extension
   - Count total lines, code lines, comment lines, blank lines
   - Calculate cyclomatic complexity (count decision points)
   - Track file type statistics
4. **Coverage Detection**: Search standard locations for coverage reports:
   - JavaScript/TypeScript: `coverage/coverage-final.json`, `coverage/lcov.info`
   - Python: `.coverage`, `coverage.xml`, `htmlcov/index.html`
   - Go: `coverage.out`
   - Java: `target/site/jacoco/jacoco.xml`
   - Parse and extract overall coverage percentage
5. **Aggregation**: Roll up all metrics into project-level statistics
6. **Rendering**: Format and output report with colors and visual elements

## Metrics Specification

### Lines of Code
- **Total Lines**: All lines in all source files
- **Code Lines**: Lines containing actual code (excludes comments and blank lines)
- **Comment Lines**: Lines that are comments (supports single-line, multi-line, JSDoc/docstrings)
- **Blank Lines**: Empty lines
- Display as absolute counts and percentages

### Comment Analysis
Per-language comment detection:
- JavaScript/TypeScript: `//`, `/* */`, `/** */`
- Python: `#`, `"""`, `'''`
- Java: `//`, `/* */`, `/** */`
- Go: `//`, `/* */`
- Ruby: `#`, `=begin =end`
- Rust: `//`, `/* */`, `///`, `//!`
- C/C++: `//`, `/* */`
- PHP: `//`, `#`, `/* */`

### File Type Breakdown
- Count files by extension
- Show distribution as count, percentage, and visual bar chart
- Sort by count (descending)

### Complexity Metrics
**Cyclomatic Complexity** calculated by counting decision points:
- Control flow keywords: `if`, `else`, `elif`, `for`, `while`, `do`, `switch`, `case`
- Logical operators: `&&`, `||`, `and`, `or`
- Ternary operators: `?`
- Exception handling: `catch`, `except`, `rescue`

**Reporting**:
- Average complexity per file
- Number of high-complexity files (threshold: >10)
- Top 5 most complex files with scores

### Test Coverage
- Read existing coverage reports (do not run tests)
- Parse multiple formats: Istanbul JSON, LCOV, Cobertura XML, Go coverage
- Display overall coverage percentage with visual bar
- Note the source file and timestamp if available
- If no coverage found, display helpful message about running tests

## CLI Output Design

### Structure

```
📊 Project Analytics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Project: /path/to/project
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
  JSON           12 files  █░░░░░░░░░░░░░░░░░░░   6.6%
  Markdown        8 files  █░░░░░░░░░░░░░░░░░░░   4.4%

Code Complexity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Average Complexity:  4.2 per file
  High Complexity:     12 files (>10)
  
  Top 5 Most Complex:
    src/parser.js        23
    src/analyzer.js      18
    lib/formatter.js     15
    utils/transform.js   13
    core/engine.js       11

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

### Color Scheme
- **Headers/Sections**: Bright cyan
- **Dividers**: Gray
- **Good metrics**: Green (high coverage, good comment ratio)
- **Warning metrics**: Yellow (moderate complexity)
- **Concerning metrics**: Red (low coverage, high complexity)
- **Secondary info**: Dim gray
- **Numbers/Data**: White (default)

### Visual Elements
- Section dividers using box-drawing characters
- Progress bars for percentages (20 character width, filled/empty blocks)
- Emoji icons for visual anchoring (📊 for header, ℹ for info notes)
- Right-aligned percentages
- Comma-separated numbers for readability
- Consistent indentation and spacing

## Error Handling

### Graceful Degradation
- If coverage file not found: Display helpful message
- If file cannot be parsed: Skip and continue (don't crash)
- If directory is empty: Display appropriate message
- If permission denied on file: Skip and note in summary

### User Feedback
- Show scanning progress for large projects (optional spinner)
- Display count of skipped/errored files if non-zero
- Provide actionable suggestions in error messages

## Performance Considerations

- Stream file processing (don't load entire files into memory)
- Use async file operations where beneficial
- Skip large files (>1MB) with a note
- Cache language detection results
- Limit directory depth (configurable, default: no limit but respect .gitignore)

## Permissions

The plugin requires one permission prompt:
- **Bash tool execution**: To run the analyzer script

Once permitted, the Node.js analyzer operates with user's normal file system permissions and can read any project files the user can read. No per-file permissions needed.

## Future Enhancements (Out of Scope)

These are explicitly NOT included in the initial implementation:
- Historical tracking of metrics over time
- Integration with CI/CD pipelines
- Custom complexity thresholds
- Git blame integration
- Export to JSON/CSV
- Web-based visualization
- Running tests to generate coverage
- Configurable ignore patterns beyond .gitignore

The design focuses on immediate, zero-configuration value for developers.

## File Structure

```
plugin_project/
├── skills/
│   └── project-stats.md           # Claude Code skill definition
├── src/
│   ├── analyzer.js                # Main analyzer script
│   ├── scanner.js                 # File system walker
│   ├── metrics.js                 # Metric calculators
│   ├── coverage.js                # Coverage report parsers
│   ├── languages.js               # Language configurations
│   └── formatter.js               # Terminal output formatter
├── package.json                   # Minimal package.json (no deps)
├── README.md                      # Plugin documentation
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-05-29-project-analytics-plugin-design.md
```

## Success Criteria

The plugin is successful if:
1. It runs on any project without configuration
2. Results appear in <2 seconds for typical projects (<500 files)
3. Output is immediately understandable without explanation
4. Works correctly for all supported languages
5. Handles edge cases gracefully (empty projects, no coverage, etc.)
6. Requires no external dependencies (pure Node.js)
7. Users find the metrics actionable and valuable
