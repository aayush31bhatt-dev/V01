import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, normalize, relative } from "node:path";
import type { AIFileAction } from "../schemas/promptExecution";

export interface AppliedFileAction {
  absolutePath: string | null;
  relativePath: string;
  changeKind: "created" | "modified";
  content: string;
  summary: string;
}

function assertSafeRelativePath(filePath: string): string {
  const normalized = normalize(filePath).replace(/\\/g, "/");
  if (isAbsolute(normalized) || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`Unsafe file path rejected: ${filePath}`);
  }
  return normalized.replace(/^\.\/+/, "");
}

export async function applyFileAction(
  workspaceRoot: string | null,
  action: AIFileAction
): Promise<AppliedFileAction> {
  const relativePath = assertSafeRelativePath(action.filePath);

  if (!workspaceRoot) {
    return {
      absolutePath: null,
      relativePath,
      changeKind: action.action === "create" ? "created" : "modified",
      content: action.content,
      summary: action.summary ?? `${action.action} ${relativePath}`
    };
  }

  const absolutePath = join(workspaceRoot, relativePath);
  const relativeToRoot = relative(workspaceRoot, absolutePath);
  if (relativeToRoot.startsWith("..") || isAbsolute(relativeToRoot)) {
    throw new Error(`File path escapes workspace root: ${action.filePath}`);
  }

  let existed = false;
  try {
    await readFile(absolutePath, "utf8");
    existed = true;
  } catch {
    existed = false;
  }

  await mkdir(dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, action.content, "utf8");

  return {
    absolutePath,
    relativePath,
    changeKind: existed ? "modified" : "created",
    content: action.content,
    summary: action.summary ?? `${existed ? "updated" : "created"} ${relativePath}`
  };
}

export function inferLanguageFromPath(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".tsx") || lower.endsWith(".ts")) return "typescript";
  if (lower.endsWith(".jsx") || lower.endsWith(".js")) return "javascript";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".md")) return "markdown";
  return "plaintext";
}
