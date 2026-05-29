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
  'obj'
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
  for (const pattern of patterns) {
    // Simple pattern matching (exact match or contains)
    if (path === pattern || path.includes(pattern)) {
      return true;
    }
  }
  return false;
}

function isBinaryFile(filename) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return BINARY_EXTENSIONS.includes(ext);
}
