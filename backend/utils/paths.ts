import fs from "fs";
import path from "path";

/**
 * Utilities for resolving application directories and common file paths.
 * These functions intentionally resolve from process.cwd() so they work
 * both in development (repo root) and in production (dist/).
 */

// Returns the application root directory (current working directory).
export function getAppRoot(): string {
  return process.cwd();
}

export function getDataDir(): string {
  const appRoot = getAppRoot();
  const candidatePaths = [
    'data',
    '../data',
    '../../data'
  ];
  for (const relativePath of candidatePaths) {
    const fullPath = path.resolve(appRoot, relativePath);
    try {
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        return fullPath;
      }
    } catch (e) {
    }
  }
  return path.resolve(appRoot, "data");
}

// Resolves a path inside the data directory.
export function resolveFilesInDataPath(...segments: string[]): string {
  return path.resolve(getDataDir(), ...segments);
}

// Ensures a directory exists (mkdir -p behavior).
export function ensureDirSync(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Ensures the parent directory for a file path exists.
export function ensureFileDirSync(filePath: string): void {
  ensureDirSync(path.dirname(filePath));
}

// Optional: resolve a path in the log directory under data/log.
export function getLogDir(): string {
  return path.resolve(getDataDir(), "log");
}
