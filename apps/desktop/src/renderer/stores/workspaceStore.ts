import { create } from "zustand";
import type { FileTreeNode, OpenFolderResult, ReadFileResult, WorkspaceTab } from "../../shared/ide";
import { getThemeProfile, normalizeHex, themeProfiles } from "../theme";

export interface OpenEditorFile extends ReadFileResult {
  originalContent: string;
  dirty: boolean;
}

interface QueuedCommand {
  id: number;
  command: string;
}

export type PromptClusterStatus = "pending" | "running" | "paused" | "completed" | "error";
export type PromptTaskStatus = "pending" | "running" | "completed" | "error";
export type ChatMessageRole = "user" | "assistant" | "system";

export interface ChatSessionMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  status: "sent" | "streaming" | "complete" | "error";
  sourceSessionId?: string;
}

export interface PromptTask {
  id: string;
  title: string;
  status: PromptTaskStatus;
  x: number;
  y: number;
  linkedFileIds: string[];
  startedAt: string | null;
  completedAt: string | null;
  expanded: boolean;
  metadata: string;
  log: string[];
}

export interface PromptFile {
  id: string;
  name: string;
  path: string | null;
  relativePath: string;
  kind: "created" | "modified" | "referenced";
  previewKind: "code" | "ui" | "stack";
  preview: string[];
  language: string;
  mockContent: string;
  x: number;
  y: number;
}

export type TimelineEntryType = "text" | "file-read" | "file-write" | "file-edit" | "terminal";
export type TimelineEntryStatus = "pending" | "active" | "done";

export interface DiffLine {
  type: "add" | "remove" | "context";
  lineNumber: number;
  content: string;
}

export interface TimelineEntry {
  id: string;
  type: TimelineEntryType;
  status: TimelineEntryStatus;
  text?: string;
  filePath?: string;
  lineRange?: string;
  linesAdded?: number;
  linesRemoved?: number;
  diffLines?: DiffLine[];
  command?: string;
  outputLines?: Array<{ text: string; kind: "stdout" | "stderr" | "success" | "info" }>;
}

export interface PromptClusterItem {
  id: string;
  title: string;
  originalPrompt: string;
  summary: string;
  content: string;
  messages: ChatSessionMessage[];
  x: number;
  y: number;
  zoom: number;
  status: PromptClusterStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  accent: string;
  expanded: boolean;
  activeTaskId: string | null;
  selectedFileId: string | null;
  history: string[];
  tasks: PromptTask[];
  files: PromptFile[];
  timeline: TimelineEntry[];
}

export interface FloatingFile {
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

export interface PromptCanvasSpawn {
  x: number;
  y: number;
}

export type CanvasBgKind = "dot-grid" | "circuit-trace" | "topographic";

export interface ChatAttachment {
  id: string;
  name: string;
  type: "file" | "image";
  mimeType: string;
  content: string; // base64 for images, text for files
  size: number;
}

export interface GeminiModelOption {
  id: string;
  label: string;
}

export const GEMINI_MODELS: GeminiModelOption[] = [
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
  { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
];

export interface WorkspaceViewportState {
  x: number;
  y: number;
  zoom: number;
}

interface PersistedWorkspaceSnapshot {
  version?: number;
  project: {
    id?: string;
    name: string;
    rootPath: string | null;
    metadata?: Record<string, unknown>;
  };
  workspace: {
    viewportX: number;
    viewportY: number;
    viewportZoom: number;
    activeSessionId: string | null;
    activeFilePath: string | null;
    leftTab: WorkspaceTab;
    terminalOpen: boolean;
    layout?: Record<string, unknown>;
  };
  preferences: {
    themeProfileId: string;
    customThemeColors: Record<string, string>;
    canvasBg?: CanvasBgKind;
    selectedModel?: string;
  };
  panels?: {
    leftSidebarOpen?: boolean;
    leftSidebarWidth?: number;
    rightSidebarOpen?: boolean;
    rightSidebarWidth?: number;
    terminalHeight?: number;
  };
  sessions: PromptClusterItem[];
  openTabs: Array<OpenEditorFile & { size?: number }>;
  floatingFiles?: FloatingFile[];
  window?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    maximized?: boolean;
  };
}

interface PendingPromptBinding {
  localSessionId: string;
  promptText: string;
  createdAt: string;
}

export interface PanelLayoutState {
  leftSidebarOpen: boolean;
  leftSidebarWidth: number;
  rightSidebarOpen: boolean;
  rightSidebarWidth: number;
  terminalHeight: number;
}

interface WorkspaceState {
  rootPath: string | null;
  projectName: string;
  tree: FileTreeNode | null;
  openFiles: OpenEditorFile[];
  activeFilePath: string | null;
  leftTab: WorkspaceTab;
  fileSearch: string;
  terminalOpen: boolean;
  panelLayout: PanelLayoutState;
  setPanelLayout: (layout: Partial<PanelLayoutState>) => void;
  queuedCommand: QueuedCommand | null;
  loadingLabel: string | null;
  error: string | null;
  lastSavedAt: string | null;
  themeProfileId: string;
  customThemeColors: Partial<import("../theme").ThemePalette>;
  prompts: PromptClusterItem[];
  activeSessionId: string | null;
  expandedSessionId: string | null;
  setExpandedSession: (sessionId: string | null) => void;
  workspaceViewport: WorkspaceViewportState;
  backendConnected: boolean;
  backendSubscribed: boolean;
  backendSessionBindings: Record<string, string>;
  pendingPromptBindings: PendingPromptBinding[];
  persistenceHydrated: boolean;
  persistenceSaving: boolean;
  hydrateWorkspace: () => Promise<void>;
  setViewportState: (viewport: WorkspaceViewportState) => void;
  openFolder: () => Promise<void>;
  refreshTree: () => Promise<void>;
  openFile: (filePath: string) => Promise<void>;
  setActiveFile: (filePath: string) => void;
  closeFile: (filePath: string) => void;
  updateActiveFileContent: (content: string) => void;
  saveActiveFile: () => Promise<void>;
  setLeftTab: (tab: WorkspaceTab) => void;
  setFileSearch: (query: string) => void;
  setTerminalOpen: (open: boolean) => void;
  queueTerminalCommand: (command: string) => void;
  consumeQueuedCommand: () => void;
  clearError: () => void;
  setThemeProfile: (profileId: string) => void;
  setCustomThemeColor: (key: keyof import("../theme").ThemePalette, value: string) => void;
  resetCustomThemeColors: () => void;
  canvasBg: CanvasBgKind;
  setCanvasBg: (bg: CanvasBgKind) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  chatAttachments: ChatAttachment[];
  addChatAttachment: (attachment: ChatAttachment) => void;
  removeChatAttachment: (id: string) => void;
  clearChatAttachments: () => void;
  addPromptCluster: (content: string, spawn?: PromptCanvasSpawn) => Promise<void>;
  sendPromptToSession: (sessionId: string | null, content: string, spawn?: PromptCanvasSpawn) => Promise<void>;
  setActiveSession: (sessionId: string | null) => void;
  movePromptCluster: (clusterId: string, x: number, y: number) => void;
  movePromptFile: (clusterId: string, fileId: string, x: number, y: number) => void;
  openPromptFile: (clusterId: string, fileId: string) => Promise<void>;
  togglePromptCluster: (clusterId: string) => void;
  deletePromptCluster: (clusterId: string) => void;
  subscribeToBackendEvents: () => void;
  floatingFiles: FloatingFile[];
  addFloatingFile: (filePath: string, x: number, y: number) => Promise<void>;
  moveFloatingFile: (fileId: string, x: number, y: number) => void;
  resizeFloatingFile: (fileId: string, width: number, height: number) => void;
  updateFloatingFileContent: (fileId: string, content: string) => void;
  saveFloatingFile: (fileId: string) => Promise<void>;
  closeFloatingFile: (fileId: string) => void;
}

function dropLatestPendingBinding(
  bindings: PendingPromptBinding[],
  match: (binding: PendingPromptBinding) => boolean
): PendingPromptBinding[] {
  for (let index = bindings.length - 1; index >= 0; index -= 1) {
    const binding = bindings[index];
    if (binding && match(binding)) {
      return [...bindings.slice(0, index), ...bindings.slice(index + 1)];
    }
  }
  return bindings;
}

function consumeLatestPendingBinding(
  bindings: PendingPromptBinding[],
  match: (binding: PendingPromptBinding) => boolean
): { binding: PendingPromptBinding; remaining: PendingPromptBinding[] } | null {
  for (let index = bindings.length - 1; index >= 0; index -= 1) {
    const binding = bindings[index];
    if (binding && match(binding)) {
      return {
        binding,
        remaining: [...bindings.slice(0, index), ...bindings.slice(index + 1)]
      };
    }
  }
  return null;
}

function toEditorFile(file: ReadFileResult): OpenEditorFile {
  return {
    ...file,
    originalContent: file.content,
    dirty: false
  };
}

function applyFolder(folder: OpenFolderResult): Partial<WorkspaceState> {
  return {
    rootPath: folder.rootPath,
    projectName: folder.projectName,
    tree: folder.tree,
    openFiles: [],
    activeFilePath: null,
    fileSearch: "",
    lastSavedAt: null
  };
}

interface PromptFileBlueprint {
  relativePath: string;
  kind: PromptFile["kind"];
  previewKind: PromptFile["previewKind"];
  preview: string[];
}

const clusterAccents = ["#75D1B3", "#F2A65A", "#8BD3FF", "#D9B66F", "#B7E08A", "#F58CA8"];
const apiBaseUrl = "http://127.0.0.1:4310";
const realtimeUrl = "ws://127.0.0.1:4310/realtime";
const defaultWorkspaceViewport: WorkspaceViewportState = { x: -180, y: -80, zoom: 1 };
const defaultFileBlueprints: readonly PromptFileBlueprint[] = [
  {
    relativePath: "src/features/GeneratedWorkspace.tsx",
    kind: "created",
    previewKind: "ui",
    preview: ["layout surface", "interactive states", "handoff ready"]
  },
  {
    relativePath: "src/features/workspace.model.ts",
    kind: "created",
    previewKind: "code",
    preview: ["state shape", "sample data", "future API boundary"]
  },
  {
    relativePath: "src/features/workspace.css",
    kind: "created",
    previewKind: "stack",
    preview: ["spacing", "tokens", "motion polish"]
  }
];
const defaultClusterAccent = clusterAccents[0] ?? "#75D1B3";
const artifactPositions = [
  { x: 560, y: 12 },
  { x: 900, y: 44 },
  { x: -390, y: -210 },
  { x: 560, y: 410 },
  { x: -420, y: 260 },
  { x: 210, y: 560 }
] as const;

function createWorkspacePath(rootPath: string | null, relativePath: string): string | null {
  if (!rootPath) {
    return null;
  }
  return `${rootPath.replace(/[\\/]+$/, "")}/${relativePath}`;
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 100_000)}`;
}

function createChatMessage(
  role: ChatMessageRole,
  content: string,
  status: ChatSessionMessage["status"] = "complete",
  sourceSessionId?: string,
  id = createId(`message-${role}`)
): ChatSessionMessage {
  return {
    id,
    role,
    content,
    createdAt: new Date().toISOString(),
    status,
    sourceSessionId
  };
}

function createAssistantReply(prompt: string, files: PromptFile[]): string {
  const fileSummary = files.length
    ? ` I also mapped ${files.length} workspace artifact${files.length === 1 ? "" : "s"} around this session.`
    : "";
  return `${createPromptSummary(prompt)}${fileSummary}`;
}

function createPromptTitle(content: string): string {
  const words = content
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  return words.length ? words.join(" ") : "Untitled prompt";
}

function createPromptSummary(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes("login") || lower.includes("auth")) {
    return "Turns the prompt into an authentication surface with UI, validation, route wiring, and styling.";
  }
  if (lower.includes("dashboard") || lower.includes("analytics")) {
    return "Breaks the request into a dashboard shell, data cards, project health views, and responsive polish.";
  }
  if (lower.includes("nav") || lower.includes("sidebar")) {
    return "Organizes navigation changes across shell structure, active states, keyboard flow, and visual hierarchy.";
  }
  if (lower.includes("setting")) {
    return "Shapes settings into clear sections with controls, persistence boundaries, and calmer visual grouping.";
  }
  return "Keeps the conversation in one floating AI session with linked file artifacts around it.";
}

function inferLanguageFromName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".tsx") || lower.endsWith(".ts")) return "typescript";
  if (lower.endsWith(".jsx") || lower.endsWith(".js")) return "javascript";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".md")) return "markdown";
  return "plaintext";
}

function createFileBlueprints(content: string): PromptFileBlueprint[] {
  const lower = content.toLowerCase();
  if (lower.includes("login") || lower.includes("auth")) {
    return [
      {
        relativePath: "src/pages/LoginPage.tsx",
        kind: "created",
        previewKind: "ui",
        preview: ["email field", "password field", "submit state"]
      },
      {
        relativePath: "src/lib/auth.ts",
        kind: "created",
        previewKind: "code",
        preview: ["session helpers", "route guard", "token boundary"]
      },
      {
        relativePath: "src/styles/auth.css",
        kind: "created",
        previewKind: "stack",
        preview: ["form spacing", "error color", "focus ring"]
      }
    ];
  }
  if (lower.includes("dashboard") || lower.includes("analytics")) {
    return [
      {
        relativePath: "src/pages/Dashboard.tsx",
        kind: "created",
        previewKind: "ui",
        preview: ["overview grid", "activity rail", "empty state"]
      },
      {
        relativePath: "src/components/MetricCard.tsx",
        kind: "created",
        previewKind: "code",
        preview: ["metric label", "trend chip", "compact chart"]
      },
      {
        relativePath: "src/data/dashboard.preview.ts",
        kind: "created",
        previewKind: "stack",
        preview: ["project health", "usage data", "recent activity"]
      }
    ];
  }
  if (lower.includes("nav") || lower.includes("sidebar")) {
    return [
      {
        relativePath: "src/layout/AppShell.tsx",
        kind: "modified",
        previewKind: "ui",
        preview: ["sidebar state", "workspace chrome", "active path"]
      },
      {
        relativePath: "src/components/NavRail.tsx",
        kind: "modified",
        previewKind: "code",
        preview: ["nav items", "keyboard focus", "route metadata"]
      },
      {
        relativePath: "src/styles/navigation.css",
        kind: "created",
        previewKind: "stack",
        preview: ["hover state", "selected rail", "motion timing"]
      }
    ];
  }
  if (lower.includes("setting")) {
    return [
      {
        relativePath: "src/pages/Settings.tsx",
        kind: "created",
        previewKind: "ui",
        preview: ["sections", "toggles", "save state"]
      },
      {
        relativePath: "src/stores/preferences.ts",
        kind: "created",
        previewKind: "code",
        preview: ["theme choice", "terminal prefs", "canvas prefs"]
      },
      {
        relativePath: "src/components/SettingRow.tsx",
        kind: "created",
        previewKind: "stack",
        preview: ["label", "control", "description"]
      }
    ];
  }
  return [...defaultFileBlueprints];
}

function createPromptPosition(index: number, spawn?: PromptCanvasSpawn): PromptCanvasSpawn {
  const seededPositions = [
    { x: -520, y: -250 },
    { x: 40, y: -60 },
    { x: -180, y: 350 },
    { x: 540, y: 250 }
  ];
  const base = spawn ?? seededPositions[index % seededPositions.length] ?? { x: 0, y: 0 };
  const angle = index * 2.3999632297;
  const radius = spawn ? 90 + (index % 4) * 36 : 0;

  return {
    x: Math.round(base.x + Math.cos(angle) * radius),
    y: Math.round(base.y + Math.sin(angle) * radius)
  };
}

function getArtifactPosition(index: number): PromptCanvasSpawn {
  return artifactPositions[index % artifactPositions.length] ?? { x: 560, y: 12 };
}

function usesLegacyFilePosition(file: Pick<PromptFile, "x" | "y">): boolean {
  return file.x >= 0 && file.x <= 340 && file.y >= 0 && file.y <= 360;
}

function normalizeArtifactPosition(file: PromptFile, index: number, existing?: PromptFile): PromptCanvasSpawn {
  if (existing) {
    return { x: existing.x, y: existing.y };
  }
  if (!Number.isFinite(file.x) || !Number.isFinite(file.y) || usesLegacyFilePosition(file)) {
    return getArtifactPosition(index);
  }
  return { x: file.x, y: file.y };
}

// These blueprints keep the canvas expressive until real prompt planning arrives.
function createPromptFiles(id: string, content: string, rootPath: string | null): PromptFile[] {
  const blueprints = createFileBlueprints(content);
  return blueprints.map((blueprint, blueprintIndex) => {
    const segments = blueprint.relativePath.split(/[\\/]/);
    const name = segments[segments.length - 1] ?? blueprint.relativePath;
    const position = getArtifactPosition(blueprintIndex);
    return {
      id: `${id}-file-${blueprintIndex}`,
      name,
      path: createWorkspacePath(rootPath, blueprint.relativePath),
      relativePath: blueprint.relativePath,
      kind: blueprint.kind,
      previewKind: blueprint.previewKind,
      preview: blueprint.preview,
      language: inferLanguageFromName(name),
      mockContent: createPreviewFileContent(name, blueprint.relativePath, content, blueprint.preview),
      x: position.x,
      y: position.y
    };
  });
}

function createPreviewFileContent(fileName: string, relativePath: string, prompt: string, preview: string[]): string {
  const language = inferLanguageFromName(fileName);
  if (language === "css") {
    return [
      `/* Local preview generated for: ${prompt} */`,
      ".v01-generated-surface {",
      "  display: grid;",
      "  gap: 16px;",
      "  border-radius: 18px;",
      "}",
      "",
      ".v01-generated-surface:focus-within {",
      "  outline: 1px solid var(--color-brand);",
      "}"
    ].join("\n");
  }
  if (language === "typescript") {
    return [
      `// Local preview for ${relativePath}`,
      `// Source prompt: ${prompt}`,
      "",
      "export const executionPreview = {",
      `  file: "${fileName}",`,
      `  intent: "${preview.join(", ")}",`,
      "  status: \"preview\",",
      "};",
      "",
      "export function describePreview() {",
      "  return executionPreview.intent;",
      "}"
    ].join("\n");
  }
  return [`Local preview for ${relativePath}`, "", `Prompt: ${prompt}`, "", ...preview.map((line) => `- ${line}`)].join("\n");
}

function createDemoTimeline(promptText: string, files: PromptFile[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  entries.push({
    id: createId("tl"),
    type: "text",
    status: "done",
    text: `Analyzing request: "${promptText.slice(0, 60)}${promptText.length > 60 ? "..." : ""}"`
  });

  if (files.length > 0) {
    entries.push({
      id: createId("tl"),
      type: "text",
      status: "done",
      text: `Planning edits across ${files.length} file${files.length !== 1 ? "s" : ""}`
    });

    entries.push({
      id: createId("tl"),
      type: "terminal",
      status: "done",
      command: "npx ts-node generate.ts",
      outputLines: [
        { text: "Compiling TypeScript...", kind: "info" },
        { text: "Generated output for " + files.length + " files", kind: "stdout" },
        { text: "✓ All files written successfully", kind: "success" }
      ]
    });

    for (const file of files) {
      const lines = file.mockContent.split("\n");
      const added = lines.length;
      const removed = file.kind === "modified" ? Math.max(1, Math.round(added * 0.15)) : 0;

      entries.push({
        id: createId("tl"),
        type: file.kind === "created" ? "file-write" : "file-edit",
        status: "done",
        filePath: file.relativePath,
        linesAdded: added,
        linesRemoved: removed,
        lineRange: `${added} lines`,
        diffLines: lines.slice(0, 12).map((content, i) => ({
          type: "add" as const,
          lineNumber: i + 1,
          content
        }))
      });
    }

    entries.push({
      id: createId("tl"),
      type: "text",
      status: "done",
      text: "Changes finalized — all files written to workspace."
    });
  }

  return entries;
}

function createPromptCluster(
  content: string,
  index: number,
  rootPath: string | null,
  spawn?: PromptCanvasSpawn,
  userMessage?: ChatSessionMessage
): PromptClusterItem {
  const id = createId("session");
  const accent = clusterAccents[index % clusterAccents.length] ?? defaultClusterAccent;
  const status: PromptClusterStatus = "pending";
  const position = createPromptPosition(index, spawn);
  const files: PromptFile[] = [];
  const tasks: PromptTask[] = [];
  const createdAt = new Date().toISOString();

  return {
    id,
    title: createPromptTitle(content),
    originalPrompt: content,
    summary: createPromptSummary(content),
    content,
    messages: [userMessage ?? createChatMessage("user", content)],
    x: position.x,
    y: position.y,
    zoom: 1,
    status,
    progress: 0,
    createdAt,
    updatedAt: createdAt,
    completedAt: null,
    accent,
    expanded: true,
    activeTaskId: tasks[0]?.id ?? null,
    selectedFileId: null,
    history: ["Conversation session created"],
    tasks,
    files,
    timeline: []
  };
}

function createVirtualEditorFile(cluster: PromptClusterItem, file: PromptFile, resolvedPath: string | null): OpenEditorFile {
  const path = resolvedPath ?? `v01://prompt/${cluster.id}/${file.name}`;
  const now = Date.now();
  return {
    path,
    name: file.name,
    content: file.mockContent,
    language: file.language,
    size: file.mockContent.length,
    mtimeMs: now,
    originalContent: file.mockContent,
    dirty: false
  };
}

function setPromptFileSelection(
  prompts: PromptClusterItem[],
  clusterId: string,
  fileId: string
): PromptClusterItem[] {
  return prompts.map((prompt) =>
    prompt.id === clusterId
      ? {
          ...prompt,
          selectedFileId: fileId,
          history: [...prompt.history, `Opened ${prompt.files.find((file) => file.id === fileId)?.name ?? "file"} in editor`]
        }
      : prompt
  );
}

function normalizePromptSession(session: PromptClusterItem, existing?: PromptClusterItem): PromptClusterItem {
  const incoming = session as Partial<PromptClusterItem> & { id: string };
  const createdAt = incoming.createdAt ?? existing?.createdAt ?? new Date().toISOString();
  const originalPrompt = incoming.originalPrompt ?? incoming.content ?? existing?.originalPrompt ?? "New AI session";
  const messages =
    incoming.messages ??
    existing?.messages ??
    (originalPrompt ? [createChatMessage("user", originalPrompt)] : []);

  return {
    id: incoming.id,
    title: incoming.title ?? existing?.title ?? createPromptTitle(originalPrompt),
    originalPrompt,
    summary: incoming.summary ?? existing?.summary ?? "Conversation session created.",
    content: incoming.content ?? existing?.content ?? originalPrompt,
    messages,
    x: incoming.x ?? existing?.x ?? 0,
    y: incoming.y ?? existing?.y ?? 0,
    zoom: incoming.zoom ?? existing?.zoom ?? 1,
    status: incoming.status ?? existing?.status ?? "pending",
    progress: incoming.progress ?? existing?.progress ?? 0,
    createdAt,
    updatedAt: incoming.updatedAt ?? existing?.updatedAt ?? createdAt,
    completedAt: incoming.completedAt ?? existing?.completedAt ?? null,
    accent: incoming.accent ?? existing?.accent ?? defaultClusterAccent,
    expanded: incoming.expanded ?? existing?.expanded ?? true,
    activeTaskId: incoming.activeTaskId ?? existing?.activeTaskId ?? null,
    selectedFileId: incoming.selectedFileId ?? existing?.selectedFileId ?? null,
    history: incoming.history ?? existing?.history ?? ["Conversation session created"],
    tasks: incoming.tasks ?? existing?.tasks ?? [],
    files: incoming.files ? mergeFiles(existing?.files ?? [], incoming.files) : existing?.files ?? [],
    timeline: incoming.timeline ?? existing?.timeline ?? []
  };
}

function mergeFiles(existingFiles: PromptFile[], incomingFiles: PromptFile[]): PromptFile[] {
  const filesByKey = new Map<string, PromptFile>();
  for (const file of existingFiles) {
    filesByKey.set(file.relativePath || file.id, file);
  }
  for (const [index, file] of incomingFiles.entries()) {
    const key = file.relativePath || file.id;
    const existing = filesByKey.get(key);
    const position = normalizeArtifactPosition(file, index, existing);
    filesByKey.set(key, {
      ...existing,
      ...file,
      x: position.x,
      y: position.y
    });
  }
  return [...filesByKey.values()];
}

function mergeHistory(existingHistory: string[], incomingHistory: string[]): string[] {
  return [...new Set([...existingHistory, ...incomingHistory])].slice(-16);
}

function mergeMessages(existingMessages: ChatSessionMessage[], incomingMessages: ChatSessionMessage[]): ChatSessionMessage[] {
  const messagesById = new Map(existingMessages.map((message) => [message.id, message]));
  for (const message of incomingMessages) {
    messagesById.set(message.id, {
      ...messagesById.get(message.id),
      ...message
    });
  }

  return [...messagesById.values()].sort((first, second) => first.createdAt.localeCompare(second.createdAt));
}

function mergeBackendSessionIntoChat(
  prompts: PromptClusterItem[],
  incomingSession: PromptClusterItem,
  targetSessionId: string | null
): PromptClusterItem[] {
  const targetIndex = prompts.findIndex((prompt) => prompt.id === targetSessionId);
  if (targetIndex < 0) {
    return upsertPromptSession(prompts, incomingSession);
  }

  const target = prompts[targetIndex];
  if (!target) {
    return prompts;
  }

  const incoming = normalizePromptSession(incomingSession, target);
  const terminal = incoming.status === "completed" || incoming.status === "error";
  const mergedMessages = mergeMessages(target.messages, incoming.messages);
  const hasReplyForExecution = mergedMessages.some((message) => message.sourceSessionId === incoming.id);
  const shouldAppendReply = terminal && !hasReplyForExecution && incoming.messages.length === 0;
  const reply =
    incoming.status === "error"
      ? `I hit an execution issue while handling that request. ${incoming.history.at(-1) ?? "Check the session history for details."}`
      : incoming.summary || createAssistantReply(incoming.originalPrompt, incoming.files);

  return prompts.map((prompt) =>
    prompt.id === target.id
      ? {
          ...prompt,
          title: incoming.title && incoming.title !== "Planning prompt" ? incoming.title : prompt.title,
          summary: incoming.summary || prompt.summary,
          content: incoming.content || prompt.content,
          status: incoming.status === "pending" && prompt.status === "running" ? prompt.status : incoming.status,
          progress: Math.max(prompt.progress, incoming.progress),
          updatedAt: incoming.updatedAt,
          completedAt: incoming.completedAt,
          activeTaskId: incoming.activeTaskId,
          history: mergeHistory(prompt.history, incoming.history),
          tasks: incoming.tasks,
          files: mergeFiles(prompt.files, incoming.files),
          messages: shouldAppendReply
            ? [
                ...mergedMessages,
                createChatMessage("assistant", reply, incoming.status === "error" ? "error" : "complete", incoming.id)
              ]
            : mergedMessages
        }
      : prompt
  );
}

function upsertPromptSession(prompts: PromptClusterItem[], session: PromptClusterItem): PromptClusterItem[] {
  const existingIndex = prompts.findIndex((prompt) => prompt.id === session.id);
  const existing = existingIndex >= 0 ? prompts[existingIndex] : undefined;
  const normalizedSession = normalizePromptSession(session, existing);
  if (existingIndex < 0) {
    return [...prompts, normalizedSession];
  }
  return prompts.map((prompt) =>
    prompt.id === session.id
      ? {
          ...normalizedSession,
          x: prompt.x,
          y: prompt.y,
          expanded: prompt.expanded,
          messages: normalizedSession.messages.length ? normalizedSession.messages : prompt.messages,
          selectedFileId: normalizedSession.selectedFileId ?? prompt.selectedFileId
        }
      : prompt
  );
}

function isPromptSession(value: unknown): value is PromptClusterItem {
  return Boolean(value && typeof value === "object" && "id" in value && "tasks" in value && "files" in value);
}

const initialPrompts: PromptClusterItem[] = [];

function createWorkspaceSnapshot(state: WorkspaceState): PersistedWorkspaceSnapshot {
  return {
    version: 2,
    project: {
      name: state.projectName,
      rootPath: state.rootPath
    },
    workspace: {
      viewportX: state.workspaceViewport.x,
      viewportY: state.workspaceViewport.y,
      viewportZoom: state.workspaceViewport.zoom,
      activeSessionId: state.activeSessionId,
      activeFilePath: state.activeFilePath,
      leftTab: state.leftTab,
      terminalOpen: state.terminalOpen,
      layout: {
        backendSessionBindings: state.backendSessionBindings
      }
    },
    preferences: {
      themeProfileId: state.themeProfileId,
      customThemeColors: Object.fromEntries(
        Object.entries(state.customThemeColors).filter((entry): entry is [string, string] => typeof entry[1] === "string")
      ),
      canvasBg: state.canvasBg,
      selectedModel: state.selectedModel
    },
    panels: {
      leftSidebarOpen: state.panelLayout.leftSidebarOpen,
      leftSidebarWidth: state.panelLayout.leftSidebarWidth,
      rightSidebarOpen: state.panelLayout.rightSidebarOpen,
      rightSidebarWidth: state.panelLayout.rightSidebarWidth,
      terminalHeight: state.panelLayout.terminalHeight
    },
    sessions: state.prompts,
    openTabs: state.openFiles,
    floatingFiles: state.floatingFiles.map((f) => ({ ...f, content: f.dirty ? f.content : f.originalContent, dirty: false }))
  };
}

let persistenceUnsubscribe: (() => void) | null = null;
let persistenceTimer: number | null = null;

function scheduleWorkspaceSnapshotPersist(): void {
  if (persistenceTimer !== null) {
    window.clearTimeout(persistenceTimer);
  }

  persistenceTimer = window.setTimeout(() => {
    persistenceTimer = null;
    void persistWorkspaceSnapshot();
  }, 650);
}

async function persistWorkspaceSnapshot(): Promise<void> {
  const state = useWorkspaceStore.getState();
  if (!state.persistenceHydrated) {
    return;
  }

  try {
    await fetch(`${apiBaseUrl}/workspace-state`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(createWorkspaceSnapshot(useWorkspaceStore.getState()))
    });
  } catch {
    // Persistence should be invisible while the API is starting; the next state change retries.
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  rootPath: null,
  projectName: "No project open",
  tree: null,
  openFiles: [],
  activeFilePath: null,
  leftTab: "explorer",
  fileSearch: "",
  terminalOpen: true,
  panelLayout: {
    leftSidebarOpen: true,
    leftSidebarWidth: 300,
    rightSidebarOpen: true,
    rightSidebarWidth: 460,
    terminalHeight: 200
  },
  setPanelLayout: (layout) => set((state) => ({ panelLayout: { ...state.panelLayout, ...layout } })),
  queuedCommand: null,
  loadingLabel: null,
  error: null,
  lastSavedAt: null,
  themeProfileId: "studio-graphite",
  customThemeColors: {},
  canvasBg: (typeof localStorage !== "undefined" ? localStorage.getItem("vibe_canvas_bg") as CanvasBgKind : null) || "dot-grid",
  selectedModel: (typeof localStorage !== "undefined" ? localStorage.getItem("vibe_selected_model") : null) || "gemini-2.5-flash",
  chatAttachments: [],
  prompts: initialPrompts,
  activeSessionId: null,
  expandedSessionId: null,
  setExpandedSession: (sessionId) => set({ expandedSessionId: sessionId, activeSessionId: sessionId }),
  workspaceViewport: defaultWorkspaceViewport,
  backendConnected: false,
  backendSubscribed: false,
  backendSessionBindings: {},
  pendingPromptBindings: [],
  floatingFiles: [],
  persistenceHydrated: false,
  persistenceSaving: false,

  hydrateWorkspace: async () => {
    if (get().persistenceHydrated) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/workspace-state`);
      if (!response.ok) {
        throw new Error(`Workspace state API returned ${response.status}`);
      }
      const snapshot = (await response.json()) as PersistedWorkspaceSnapshot;
      const rootPath = snapshot.project.rootPath;
      let tree: FileTreeNode | null = null;
      if (rootPath) {
        try {
          tree = await window.v01.workspace.refreshTree(rootPath);
        } catch {
          tree = null;
        }
      }

      const panels = snapshot.panels;
      set({
        rootPath,
        projectName: snapshot.project.name,
        tree,
        openFiles: snapshot.openTabs.map((file) => ({
          ...file,
          size: file.size ?? file.content.length,
          mtimeMs: file.mtimeMs ?? Date.now()
        })),
        activeFilePath: snapshot.workspace.activeFilePath,
        leftTab: snapshot.workspace.leftTab,
        terminalOpen: snapshot.workspace.terminalOpen,
        themeProfileId: getThemeProfile(snapshot.preferences.themeProfileId).id,
        customThemeColors: snapshot.preferences.customThemeColors,
        canvasBg: snapshot.preferences.canvasBg ?? "dot-grid",
        selectedModel: snapshot.preferences.selectedModel ?? "gemini-2.5-flash",
        prompts: snapshot.sessions.map((session) => normalizePromptSession(session)),
        activeSessionId: snapshot.workspace.activeSessionId,
        workspaceViewport: {
          x: snapshot.workspace.viewportX,
          y: snapshot.workspace.viewportY,
          zoom: snapshot.workspace.viewportZoom
        },
        panelLayout: {
          leftSidebarOpen: panels?.leftSidebarOpen ?? true,
          leftSidebarWidth: panels?.leftSidebarWidth ?? 300,
          rightSidebarOpen: panels?.rightSidebarOpen ?? true,
          rightSidebarWidth: panels?.rightSidebarWidth ?? 460,
          terminalHeight: panels?.terminalHeight ?? 200
        },
        floatingFiles: (snapshot.floatingFiles ?? []).map((f) => ({ ...f, originalContent: f.content ?? f.originalContent, dirty: false })),
        backendSessionBindings:
          (snapshot.workspace.layout?.backendSessionBindings as Record<string, string> | undefined) ?? {},
        persistenceHydrated: true
      });

      // Restore window state if available
      if (snapshot.window) {
        try {
          if (snapshot.window.maximized) {
            void window.v01.window.toggleMaximize();
          }
        } catch {}
      }
    } catch {
      set({ persistenceHydrated: true });
    }
  },

  setViewportState: (viewport) => set({ workspaceViewport: viewport }),

  openFolder: async () => {
    set({ loadingLabel: "Opening folder", error: null });
    try {
      const folder = await window.v01.workspace.openFolder();
      if (folder) {
        set(applyFolder(folder));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to open folder." });
    } finally {
      set({ loadingLabel: null });
    }
  },

  refreshTree: async () => {
    const { rootPath } = get();
    if (!rootPath) {
      return;
    }

    set({ loadingLabel: "Refreshing files", error: null });
    try {
      const tree = await window.v01.workspace.refreshTree(rootPath);
      set({ tree });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to refresh files." });
    } finally {
      set({ loadingLabel: null });
    }
  },

  openFile: async (filePath) => {
    const existing = get().openFiles.find((file) => file.path === filePath);
    if (existing) {
      set({ activeFilePath: filePath });
      return;
    }

    set({ loadingLabel: "Opening file", error: null });
    try {
      const file = await window.v01.workspace.readFile(filePath);
      set((state) => ({
        openFiles: [...state.openFiles, toEditorFile(file)],
        activeFilePath: file.path
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to open file." });
    } finally {
      set({ loadingLabel: null });
    }
  },

  setActiveFile: (filePath) => set({ activeFilePath: filePath }),

  closeFile: (filePath) =>
    set((state) => {
      const nextOpenFiles = state.openFiles.filter((file) => file.path !== filePath);
      const wasActive = state.activeFilePath === filePath;
      return {
        openFiles: nextOpenFiles,
        activeFilePath: wasActive ? nextOpenFiles[nextOpenFiles.length - 1]?.path ?? null : state.activeFilePath
      };
    }),

  updateActiveFileContent: (content) =>
    set((state) => ({
      openFiles: state.openFiles.map((file) =>
        file.path === state.activeFilePath
          ? {
              ...file,
              content,
              dirty: content !== file.originalContent
            }
          : file
      )
    })),

  saveActiveFile: async () => {
    const { activeFilePath, openFiles } = get();
    const activeFile = openFiles.find((file) => file.path === activeFilePath);
    if (!activeFile) {
      return;
    }

    if (activeFile.path.startsWith("v01://")) {
      set((state) => ({
        openFiles: state.openFiles.map((file) =>
          file.path === activeFile.path
            ? {
                ...file,
                originalContent: file.content,
                dirty: false,
                mtimeMs: Date.now()
              }
            : file
        ),
        lastSavedAt: new Date().toISOString()
      }));
      return;
    }

    set({ loadingLabel: "Saving file", error: null });
    try {
      const result = await window.v01.workspace.saveFile({
        path: activeFile.path,
        content: activeFile.content
      });
      set((state) => ({
        openFiles: state.openFiles.map((file) =>
          file.path === activeFile.path
            ? {
                ...file,
                originalContent: file.content,
                dirty: false,
                mtimeMs: result.mtimeMs
              }
            : file
        ),
        lastSavedAt: result.savedAt
      }));
      await get().refreshTree();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to save file." });
    } finally {
      set({ loadingLabel: null });
    }
  },

  setLeftTab: (tab) => set({ leftTab: tab }),
  setFileSearch: (query) => set({ fileSearch: query }),
  setTerminalOpen: (open) => set({ terminalOpen: open }),
  queueTerminalCommand: (command) =>
    set({ terminalOpen: true, queuedCommand: { id: Date.now(), command } }),
  consumeQueuedCommand: () => set({ queuedCommand: null }),
  clearError: () => set({ error: null }),
  setThemeProfile: (profileId: string) => {
    const next = getThemeProfile(profileId);
    set({ themeProfileId: next.id });
  },
  resetCustomThemeColors: () => set({ customThemeColors: {} }),
  setCustomThemeColor: (key, value) =>
    set((state) => ({
      customThemeColors: {
        ...state.customThemeColors,
        [key]: normalizeHex(value)
      },
      themeProfileId: "custom"
    })),
  setCanvasBg: (bg) => {
    localStorage.setItem("vibe_canvas_bg", bg);
    set({ canvasBg: bg });
  },
  setSelectedModel: (model) => {
    localStorage.setItem("vibe_selected_model", model);
    set({ selectedModel: model });
  },
  addChatAttachment: (attachment) =>
    set((state) => ({ chatAttachments: [...state.chatAttachments, attachment] })),
  removeChatAttachment: (id) =>
    set((state) => ({ chatAttachments: state.chatAttachments.filter((a) => a.id !== id) })),
  clearChatAttachments: () => set({ chatAttachments: [] }),
  addPromptCluster: async (text, spawn) => {
    await get().sendPromptToSession(get().activeSessionId, text, spawn);
  },
  sendPromptToSession: async (textSessionId, text, spawn) => {
    const promptText = text.trim();
    if (!promptText) {
      return;
    }

    const { rootPath, prompts, activeSessionId } = get();
    const requestedSessionId = textSessionId ?? activeSessionId;
    const existingSession = requestedSessionId
      ? prompts.find((prompt) => prompt.id === requestedSessionId)
      : null;
    let localSessionId = existingSession?.id ?? null;
    const now = new Date().toISOString();
    const userMessage = createChatMessage("user", promptText, "complete");

    if (!existingSession) {
      const session = createPromptCluster(promptText, prompts.length, rootPath, spawn, userMessage);
      localSessionId = session.id;
      set((state) => ({
        activeSessionId: session.id,
        pendingPromptBindings: [...state.pendingPromptBindings, { localSessionId: session.id, promptText, createdAt: now }].slice(
          -24
        ),
        prompts: [
          ...state.prompts,
          {
            ...session,
            status: "running",
            progress: 4,
            updatedAt: now,
            history: ["Conversation session created", "Prompt sent to AI"]
          }
        ]
      }));
    } else {
      set((state) => ({
        activeSessionId: existingSession.id,
        pendingPromptBindings: [...state.pendingPromptBindings, { localSessionId: existingSession.id, promptText, createdAt: now }].slice(
          -24
        ),
        prompts: state.prompts.map((prompt) =>
          prompt.id === existingSession.id
            ? {
                ...prompt,
                status: "running",
                progress: Math.max(prompt.progress, 8),
                updatedAt: now,
                messages: [...prompt.messages, userMessage],
                history: [...prompt.history, "New prompt appended to session"].slice(-16)
              }
            : prompt
        )
      }));
    }

    if (!localSessionId) {
      return;
    }

    const targetBeforeRequest = get().prompts.find((prompt) => prompt.id === localSessionId);
    const recentHistory = targetBeforeRequest?.messages
      .slice(-8)
      .map((message) => `${message.role}: ${message.content}`)
      ?? [promptText];

    const { selectedModel, chatAttachments } = get();
    const attachmentsPayload = chatAttachments.length > 0 ? chatAttachments : undefined;
    set({ chatAttachments: [] });

    try {
      const response = await fetch(`${apiBaseUrl}/prompts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: promptText,
          clientSessionId: localSessionId,
          clientMessageId: userMessage.id,
          workspaceRoot: rootPath,
          position: spawn,
          recentHistory,
          model: selectedModel,
          attachments: attachmentsPayload
        })
      });

      if (!response.ok) {
        throw new Error(`Prompt API returned ${response.status}`);
      }

      const session = (await response.json()) as PromptClusterItem;
      set((state) => {
        const backendSessionBindings = {
          ...state.backendSessionBindings,
          [session.id]: localSessionId
        };
        const pendingPromptBindings = dropLatestPendingBinding(
          state.pendingPromptBindings,
          (binding) => binding.localSessionId === localSessionId && binding.promptText === promptText
        );

        return {
          backendConnected: true,
          backendSessionBindings,
          pendingPromptBindings,
          prompts: mergeBackendSessionIntoChat(state.prompts, session, localSessionId)
        };
      });
    } catch {
      const fallbackFiles = createPromptFiles(localSessionId, promptText, rootPath);
      const timeline = createDemoTimeline(promptText, fallbackFiles);
      set((state) => ({
        backendConnected: false,
        pendingPromptBindings: dropLatestPendingBinding(
          state.pendingPromptBindings,
          (binding) => binding.localSessionId === localSessionId && binding.promptText === promptText
        ),
        prompts: state.prompts.map((prompt) =>
          prompt.id === localSessionId
            ? {
                ...prompt,
                status: "completed",
                progress: 100,
                updatedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                summary: createPromptSummary(promptText),
                files: mergeFiles(prompt.files, fallbackFiles),
                timeline,
                messages: [
                  ...prompt.messages,
                  createChatMessage("assistant", createAssistantReply(promptText, fallbackFiles), "complete", `${localSessionId}-local`)
                ],
                history: [...prompt.history, "AI backend unavailable; local preview response attached"].slice(-16)
              }
            : prompt
        )
      }));
    }
  },
  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
  movePromptCluster: (clusterId, x, y) =>
    set((state) => ({
      prompts: state.prompts.map((prompt) =>
        prompt.id === clusterId
          ? {
              ...prompt,
              x,
              y
            }
          : prompt
      )
    })),
  movePromptFile: (clusterId, fileId, x, y) =>
    set((state) => ({
      prompts: state.prompts.map((prompt) =>
        prompt.id === clusterId
          ? {
              ...prompt,
              files: prompt.files.map((file) =>
                file.id === fileId
                  ? {
                      ...file,
                      x,
                      y
                    }
                  : file
              )
            }
          : prompt
      )
    })),
  openPromptFile: async (clusterId, fileId) => {
    const state = get();
    const cluster = state.prompts.find((prompt) => prompt.id === clusterId);
    const file = cluster?.files.find((candidate) => candidate.id === fileId);
    if (!cluster || !file) {
      return;
    }

    const resolvedPath = file.path ?? createWorkspacePath(state.rootPath, file.relativePath);
    set((current) => ({
      prompts: setPromptFileSelection(current.prompts, clusterId, fileId),
      loadingLabel: resolvedPath ? "Opening mapped file" : null,
      error: null
    }));

    if (resolvedPath) {
      const existing = get().openFiles.find((openFile) => openFile.path === resolvedPath);
      if (existing) {
        set({ activeFilePath: resolvedPath, loadingLabel: null });
        return;
      }

      try {
        const readFile = await window.v01.workspace.readFile(resolvedPath);
        set((current) => ({
          openFiles: [...current.openFiles, toEditorFile(readFile)],
          activeFilePath: readFile.path,
          loadingLabel: null
        }));
        return;
      } catch {
        // Backend artifacts can arrive before a refreshed file tree sees them. Fall through to a virtual Monaco document.
      }
    }

    const virtualFile = createVirtualEditorFile(cluster, file, null);
    set((current) => {
      const exists = current.openFiles.some((openFile) => openFile.path === virtualFile.path);
      return {
        openFiles: exists ? current.openFiles : [...current.openFiles, virtualFile],
        activeFilePath: virtualFile.path,
        loadingLabel: null
      };
    });
  },
  togglePromptCluster: (clusterId) =>
    set((state) => ({
      prompts: state.prompts.map((prompt) =>
        prompt.id === clusterId
          ? {
              ...prompt,
              expanded: !prompt.expanded
            }
          : prompt
      )
    })),
  deletePromptCluster: (clusterId) =>
    set((state) => ({
      prompts: state.prompts.filter((prompt) => prompt.id !== clusterId),
      activeSessionId: state.activeSessionId === clusterId ? null : state.activeSessionId
    })),
  subscribeToBackendEvents: () => {
    if (get().backendSubscribed) {
      return;
    }

    set({ backendSubscribed: true });
    const socket = new WebSocket(realtimeUrl);

    socket.addEventListener("open", () => {
      set({ backendConnected: true });
    });

    socket.addEventListener("message", (message) => {
      try {
        const event = JSON.parse(String(message.data)) as {
          type?: string;
          sessionId?: string;
          session?: unknown;
          error?: string;
        };
        if (isPromptSession(event.session)) {
          const session = event.session;
          set((state) => {
            const backendSessionId = event.sessionId || session.id;
            const inferredTargetFromMessages = backendSessionId
              ? state.prompts.find((prompt) => prompt.messages.some((msg) => msg.sourceSessionId === backendSessionId))
                  ?.id ?? null
              : null;
            const boundLocalSessionId = backendSessionId ? state.backendSessionBindings[backendSessionId] ?? null : null;

            let targetLocalSessionId = boundLocalSessionId ?? inferredTargetFromMessages;
            let backendSessionBindings = state.backendSessionBindings;
            let pendingPromptBindings = state.pendingPromptBindings;

            if (!targetLocalSessionId && backendSessionId) {
              const promptKey = session.originalPrompt || session.content || "";
              const consumed = consumeLatestPendingBinding(pendingPromptBindings, (binding) => binding.promptText === promptKey);
              if (consumed) {
                targetLocalSessionId = consumed.binding.localSessionId;
                pendingPromptBindings = consumed.remaining;
                backendSessionBindings = {
                  ...backendSessionBindings,
                  [backendSessionId]: targetLocalSessionId
                };
              }
            }

            if (!targetLocalSessionId && backendSessionId) {
              // Last-resort: if the session already exists locally by backend ID, bind it.
              const existingByBackendId = state.prompts.find((prompt) => prompt.id === backendSessionId);
              if (existingByBackendId) {
                targetLocalSessionId = existingByBackendId.id;
                backendSessionBindings = {
                  ...backendSessionBindings,
                  [backendSessionId]: targetLocalSessionId
                };
              }
            }

            return {
              backendConnected: true,
              backendSessionBindings,
              pendingPromptBindings,
              prompts: mergeBackendSessionIntoChat(state.prompts, session, targetLocalSessionId)
            };
          });
        }
        if (event.type === "EXECUTION_ERROR" && event.error) {
          set({ error: event.error });
        }
      } catch {
        // Ignore malformed realtime payloads.
      }
    });

    socket.addEventListener("close", () => {
      set({ backendConnected: false, backendSubscribed: false });
      window.setTimeout(() => {
        get().subscribeToBackendEvents();
      }, 1500);
    });

    socket.addEventListener("error", () => {
      set({ backendConnected: false });
    });
  },

  addFloatingFile: async (filePath, x, y) => {
    const existing = get().floatingFiles.find((f) => f.path === filePath);
    if (existing) return;

    try {
      const file = await window.v01.workspace.readFile(filePath);
      const floatingFile: FloatingFile = {
        id: createId("floating"),
        path: file.path,
        name: file.name,
        content: file.content,
        originalContent: file.content,
        language: file.language,
        dirty: false,
        x,
        y,
        width: 480,
        height: 360
      };
      set((state) => ({ floatingFiles: [...state.floatingFiles, floatingFile] }));
    } catch {
      // File may not be readable
    }
  },

  moveFloatingFile: (fileId, x, y) =>
    set((state) => ({
      floatingFiles: state.floatingFiles.map((f) =>
        f.id === fileId ? { ...f, x, y } : f
      )
    })),

  resizeFloatingFile: (fileId, width, height) =>
    set((state) => ({
      floatingFiles: state.floatingFiles.map((f) =>
        f.id === fileId ? { ...f, width: Math.max(280, width), height: Math.max(180, height) } : f
      )
    })),

  updateFloatingFileContent: (fileId, content) =>
    set((state) => ({
      floatingFiles: state.floatingFiles.map((f) =>
        f.id === fileId ? { ...f, content, dirty: content !== f.originalContent } : f
      )
    })),

  saveFloatingFile: async (fileId) => {
    const file = get().floatingFiles.find((f) => f.id === fileId);
    if (!file || !file.dirty) return;

    try {
      await window.v01.workspace.saveFile({ path: file.path, content: file.content });
      set((state) => ({
        floatingFiles: state.floatingFiles.map((f) =>
          f.id === fileId ? { ...f, originalContent: f.content, dirty: false } : f
        )
      }));
    } catch {
      // Save failed silently
    }
  },

  closeFloatingFile: (fileId) =>
    set((state) => ({
      floatingFiles: state.floatingFiles.filter((f) => f.id !== fileId)
    }))
}));

export function startWorkspacePersistence(): void {
  if (persistenceUnsubscribe) {
    return;
  }

  persistenceUnsubscribe = useWorkspaceStore.subscribe((state) => {
    if (!state.persistenceHydrated || state.persistenceSaving) {
      return;
    }
    scheduleWorkspaceSnapshotPersist();
  });
}

export function selectActiveFile(state: WorkspaceState): OpenEditorFile | null {
  return state.openFiles.find((file) => file.path === state.activeFilePath) ?? null;
}

let lastCustomThemeColors: Partial<import("../theme").ThemePalette> | null = null;
let lastCustomPalette: import("../theme").ThemePalette | null = null;

export function selectThemePalette(state: WorkspaceState) {
  if (state.themeProfileId === "custom") {
    if (lastCustomThemeColors === state.customThemeColors && lastCustomPalette) {
      return lastCustomPalette;
    }
    const customBase = getThemeProfile("custom").palette;
    lastCustomThemeColors = state.customThemeColors;
    lastCustomPalette = {
      ...customBase,
      ...state.customThemeColors
    };
    return lastCustomPalette;
  }
  return getThemeProfile(state.themeProfileId).palette;
}

export function selectThemeProfiles() {
  return themeProfiles;
}
