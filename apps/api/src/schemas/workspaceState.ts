import { z } from "zod";
import { promptSessionSchema } from "./promptExecution";

export const persistedOpenTabSchema = z.object({
  path: z.string(),
  name: z.string(),
  content: z.string(),
  language: z.string(),
  size: z.number().optional(),
  mtimeMs: z.number(),
  originalContent: z.string(),
  dirty: z.boolean()
});

export const floatingFileSchema = z.object({
  id: z.string(),
  path: z.string(),
  name: z.string(),
  content: z.string(),
  originalContent: z.string(),
  language: z.string(),
  dirty: z.boolean(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number()
});

export const panelLayoutSchema = z.object({
  leftSidebarOpen: z.boolean().optional(),
  leftSidebarWidth: z.number().optional(),
  rightSidebarOpen: z.boolean().optional(),
  rightSidebarWidth: z.number().optional(),
  terminalHeight: z.number().optional()
}).optional();

export const windowStateSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  maximized: z.boolean().optional()
}).optional();

export const workspaceSnapshotSchema = z.object({
  version: z.number().optional(),
  project: z.object({
    id: z.string().optional(),
    name: z.string(),
    rootPath: z.string().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional()
  }),
  workspace: z.object({
    viewportX: z.number(),
    viewportY: z.number(),
    viewportZoom: z.number(),
    activeSessionId: z.string().nullable(),
    activeFilePath: z.string().nullable(),
    leftTab: z.string(),
    terminalOpen: z.boolean(),
    layout: z.record(z.string(), z.unknown()).optional()
  }),
  preferences: z.object({
    themeProfileId: z.string(),
    customThemeColors: z.record(z.string(), z.string()),
    canvasBg: z.string().optional(),
    selectedModel: z.string().optional()
  }),
  panels: panelLayoutSchema,
  sessions: z.array(promptSessionSchema),
  openTabs: z.array(persistedOpenTabSchema),
  floatingFiles: z.array(floatingFileSchema).optional(),
  window: windowStateSchema
});

export type WorkspaceSnapshotInput = z.infer<typeof workspaceSnapshotSchema>;
