import { readdir, stat, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const DEFAULT_EXCLUDES = [
  'node_modules',
  'vendor',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  'target',
  'bin',
  'obj',
  'venv',
  '.venv',
  'AppData'
];

const BINARY_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.mp4', '.mp3', '.wav', '.avi',
  '.zip', '.tar', '.gz', '.rar',
  '.exe', '.dll', '.so', '.dylib',
  '.pdf', '.doc', '.docx',
  '.woff', '.woff2', '.ttf', '.eot'
];

export async function scanDirectory(rootPath) {
  const absoluteRoot = resolve(rootPath);
  const gitignorePatterns = await loadGitignore(absoluteRoot);
  const files = [];

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = fullPath.substring(absoluteRoot.length + 1);

      // Skip default excludes
      if (DEFAULT_EXCLUDES.some(pattern => relativePath.includes(pattern))) {
        continue;
      }

      // Skip gitignored paths
      if (isIgnored(relativePath, gitignorePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        // Skip binary files
        if (!isBinaryFile(entry.name)) {
          files.push(fullPath);
        }
      }
    }
  }

  await walk(absoluteRoot);
  return files;
}

async function loadGitignore(rootPath) {
  try {
    const gitignorePath = join(rootPath, '.gitignore');
    const content = await readFile(gitignorePath, 'utf-8');
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch (error) {
    return [];
  }
}

function isIgnored(path, patterns) {
  // Normalize path separators for consistent matching
  const normalizedPath = path.replace(/\\/g, '/');

  for (const pattern of patterns) {
    // Handle directory patterns (ending with /)
    if (pattern.endsWith('/')) {
      const dirPattern = pattern.slice(0, -1);
      if (normalizedPath === dirPattern || normalizedPath.startsWith(dirPattern + '/')) {
        return true;
      }
    }

    // Handle wildcard patterns (e.g., *.log, __pycache__)
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      const fileName = normalizedPath.split('/').pop();
      if (regex.test(fileName) || regex.test(normalizedPath)) {
        return true;
      }
    }

    // Handle exact match or contains
    if (normalizedPath === pattern || normalizedPath.includes(pattern)) {
      return true;
    }

    // Handle directory name matching (e.g., "__pycache__" matches "src/__pycache__/file.py")
    const pathParts = normalizedPath.split('/');
    if (pathParts.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function isBinaryFile(filename) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return BINARY_EXTENSIONS.includes(ext);
}
