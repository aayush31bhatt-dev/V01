export type WorkspaceTab = "explorer" | "history" | "settings";

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

export interface OpenFolderResult {
  rootPath: string;
  projectName: string;
  tree: FileTreeNode;
}

export interface ReadFileResult {
  path: string;
  name: string;
  content: string;
  language: string;
  size: number;
  mtimeMs: number;
}

export interface SaveFileInput {
  path: string;
  content: string;
}

export interface SaveFileResult {
  path: string;
  savedAt: string;
  mtimeMs: number;
}

export interface ResolvePathInput {
  cwd?: string | null;
  target: string;
}

export interface ResolvePathResult {
  path: string;
}

export interface RunTerminalCommandInput {
  command: string;
  cwd?: string | null;
}

export interface RunTerminalCommandResult {
  commandId: string;
}

export interface TerminalDataEvent {
  commandId: string;
  data: string;
}

export interface TerminalExitEvent {
  commandId: string;
  code: number | null;
}
