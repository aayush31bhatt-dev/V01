import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

export interface RepositoryContext {
  rootPath: string | null;
  files: string[];
}

const ignoredDirectories = new Set([".git", "node_modules", "dist", "build", ".next", "out"]);

export async function scanRepository(rootPath: string | null, maxFiles = 80): Promise<RepositoryContext> {
  if (!rootPath) {
    return {
      rootPath: null,
      files: []
    };
  }

  const safeRootPath = rootPath;
  const files: string[] = [];

  async function walk(currentPath: string): Promise<void> {
    if (files.length >= maxFiles) {
      return;
    }

    const entries = await readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length >= maxFiles) {
        return;
      }

      const fullPath = join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) {
          await walk(fullPath);
        }
        continue;
      }

      if (entry.isFile()) {
        const fileStat = await stat(fullPath);
        if (fileStat.size <= 300_000) {
          files.push(relative(safeRootPath, fullPath).replace(/\\/g, "/"));
        }
      }
    }
  }

  try {
    await walk(safeRootPath);
  } catch {
    return {
      rootPath: safeRootPath,
      files
    };
  }

  return {
    rootPath: safeRootPath,
    files
  };
}
