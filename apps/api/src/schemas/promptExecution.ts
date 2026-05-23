import { z } from "zod";

export const promptSessionStatusSchema = z.enum(["pending", "running", "paused", "completed", "error"]);
export const promptTaskStatusSchema = z.enum(["pending", "running", "completed", "error"]);
export const chatMessageRoleSchema = z.enum(["user", "assistant", "system"]);
export const chatMessageStatusSchema = z.enum(["sent", "streaming", "complete", "error"]);
export const fileActionKindSchema = z.enum(["create", "update"]);
export const promptFileKindSchema = z.enum(["created", "modified", "referenced"]);
export const promptPreviewKindSchema = z.enum(["code", "ui", "stack"]);

export const promptCanvasPositionSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const chatAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["file", "image"]),
  mimeType: z.string(),
  content: z.string(),
  size: z.number()
});

export const createPromptSessionSchema = z.object({
  prompt: z.string().min(1).max(12000),
  clientSessionId: z.string().min(1).max(160).optional(),
  clientMessageId: z.string().min(1).max(180).optional(),
  workspaceRoot: z.string().min(1).nullable().optional(),
  position: promptCanvasPositionSchema.optional(),
  recentHistory: z.array(z.string()).optional(),
  model: z.string().optional(),
  attachments: z.array(chatAttachmentSchema).optional()
});

export const aiTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional()
});

export const aiFileActionSchema = z.object({
  id: z.string().min(1).optional(),
  taskId: z.string().min(1),
  filePath: z.string().min(1),
  action: fileActionKindSchema,
  content: z.string(),
  summary: z.string().optional()
});

export const aiPlanSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  tasks: z.array(aiTaskSchema).max(8),
  fileActions: z.array(aiFileActionSchema).max(24),
  explanation: z.string().optional()
});

export const promptTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: promptTaskStatusSchema,
  x: z.number(),
  y: z.number(),
  linkedFileIds: z.array(z.string()),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  expanded: z.boolean(),
  metadata: z.string(),
  log: z.array(z.string())
});

export const promptFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string().nullable(),
  relativePath: z.string(),
  kind: promptFileKindSchema,
  previewKind: promptPreviewKindSchema,
  preview: z.array(z.string()),
  language: z.string(),
  mockContent: z.string(),
  x: z.number(),
  y: z.number(),
  changeSummary: z.string().optional()
});

export const chatSessionMessageSchema = z.object({
  id: z.string(),
  role: chatMessageRoleSchema,
  content: z.string(),
  createdAt: z.string(),
  status: chatMessageStatusSchema,
  sourceSessionId: z.string().optional()
});

export const promptSessionSchema = z.object({
  id: z.string(),
  title: z.string(),
  originalPrompt: z.string(),
  summary: z.string(),
  content: z.string(),
  messages: z.array(chatSessionMessageSchema),
  x: z.number(),
  y: z.number(),
  zoom: z.number(),
  status: promptSessionStatusSchema,
  progress: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
  accent: z.string(),
  expanded: z.boolean(),
  activeTaskId: z.string().nullable(),
  selectedFileId: z.string().nullable(),
  history: z.array(z.string()),
  tasks: z.array(promptTaskSchema),
  files: z.array(promptFileSchema),
  timeline: z.array(z.unknown()).optional()
});

export type CreatePromptSessionInput = z.infer<typeof createPromptSessionSchema>;
export type AIPlan = z.infer<typeof aiPlanSchema>;
export type AIFileAction = z.infer<typeof aiFileActionSchema>;
export type ChatSessionMessageDto = z.infer<typeof chatSessionMessageSchema>;
export type PromptTaskDto = z.infer<typeof promptTaskSchema>;
export type PromptFileDto = z.infer<typeof promptFileSchema>;
export type PromptSessionDto = z.infer<typeof promptSessionSchema>;
export type PromptSessionStatus = z.infer<typeof promptSessionStatusSchema>;
export type PromptTaskStatus = z.infer<typeof promptTaskStatusSchema>;
