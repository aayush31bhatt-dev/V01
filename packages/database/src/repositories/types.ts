export type PersistedSessionStatus = "pending" | "running" | "paused" | "completed" | "error";
export type PersistedTaskStatus = "pending" | "running" | "completed" | "error";
export type PersistedMessageRole = "user" | "assistant" | "system";
export type PersistedMessageStatus = "sent" | "streaming" | "complete" | "error";
export type PersistedFileKind = "created" | "modified" | "referenced";
export type PersistedPreviewKind = "code" | "ui" | "stack";

export interface PersistedProject {
  id: string;
  name: string;
  rootPath: string | null;
  metadata?: Record<string, unknown>;
}

export interface PersistedMessage {
  id: string;
  role: PersistedMessageRole;
  content: string;
  createdAt: string;
  status: PersistedMessageStatus;
  sourceSessionId?: string;
}

export interface PersistedTask {
  id: string;
  title: string;
  status: PersistedTaskStatus;
  x: number;
  y: number;
  linkedFileIds: string[];
  startedAt: string | null;
  completedAt: string | null;
  expanded: boolean;
  metadata: string;
  log: string[];
}

export interface PersistedFileArtifact {
  id: string;
  name: string;
  path: string | null;
  relativePath: string;
  kind: PersistedFileKind;
  previewKind: PersistedPreviewKind;
  preview: string[];
  language: string;
  mockContent: string;
  x: number;
  y: number;
  changeSummary?: string;
}

export interface PersistedSession {
  id: string;
  title: string;
  originalPrompt: string;
  summary: string;
  content: string;
  messages: PersistedMessage[];
  x: number;
  y: number;
  zoom: number;
  status: PersistedSessionStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  accent: string;
  expanded: boolean;
  activeTaskId: string | null;
  selectedFileId: string | null;
  history: string[];
  tasks: PersistedTask[];
  files: PersistedFileArtifact[];
}

export interface PersistedOpenTab {
  path: string;
  name: string;
  content: string;
  language: string;
  size?: number;
  mtimeMs: number;
  originalContent: string;
  dirty: boolean;
}

export interface PersistedWorkspaceView {
  viewportX: number;
  viewportY: number;
  viewportZoom: number;
  activeSessionId: string | null;
  activeFilePath: string | null;
  leftTab: string;
  terminalOpen: boolean;
  layout?: Record<string, unknown>;
}

export interface PersistedPreferences {
  themeProfileId: string;
  customThemeColors: Record<string, string>;
  canvasBg?: string;
  selectedModel?: string;
}

export interface PersistedPanelLayout {
  leftSidebarOpen?: boolean;
  leftSidebarWidth?: number;
  rightSidebarOpen?: boolean;
  rightSidebarWidth?: number;
  terminalHeight?: number;
}

export interface PersistedFloatingFile {
  id: string;
  path: string;
  name: string;
  content: string;
  originalContent: string;
  language: string;
  dirty: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WorkspaceSnapshot {
  project: PersistedProject;
  workspace: PersistedWorkspaceView;
  preferences: PersistedPreferences;
  sessions: PersistedSession[];
  openTabs: PersistedOpenTab[];
  panels?: PersistedPanelLayout;
  floatingFiles?: PersistedFloatingFile[];
}

export interface RecordExecutionEventInput {
  projectId: string;
  sessionId?: string | null;
  taskId?: string | null;
  aiResponseId?: string | null;
  kind: string;
  status: string;
  originalPrompt?: string | null;
  message?: string | null;
  payload?: Record<string, unknown>;
  fileChanges?: unknown[];
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface RecordAIResponseInput {
  projectId: string;
  sessionId: string;
  taskId?: string | null;
  provider: string;
  model: string;
  prompt: string;
  normalizedPrompt?: string | null;
  response: string;
  status?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  raw?: Record<string, unknown>;
}
