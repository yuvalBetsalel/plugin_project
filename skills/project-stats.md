---
name: project-stats
description: Analyze project source files and display metrics (LOC, comments, coverage, complexity, file types)
---

Display comprehensive analytics for the current project including lines of code, comment density, test coverage, file type breakdown, and complexity metrics.

## Usage

When the user invokes this skill:

1. Use the Bash tool to run the analyzer on the current working directory
2. Display the formatted output to the user

## Implementation

**Step 1: Run the analyzer**

Use Bash tool:
```bash
node C:\Users\I765591\.claude\plugins\plugin_project\src\analyzer.js .
```

**Step 2: Display results**

The analyzer outputs a formatted report to stdout. Present this directly to the user.

## Error Handling

If the analyzer fails:
- Check that Node.js is available
- Verify the project directory is accessible
- Suggest running tests first if coverage data is missing

## Notes

- The tool analyzes existing files and coverage reports (does not run tests)
- Supports JavaScript, TypeScript, Python, Java, Go, Ruby, Rust, C/C++, PHP
- Respects .gitignore patterns
- Results appear in <2 seconds for typical projects
