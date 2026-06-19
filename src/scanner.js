import { readdir } from 'node:fs/promises';
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

function isBinaryFile(filename) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return BINARY_EXTENSIONS.includes(ext);
}
