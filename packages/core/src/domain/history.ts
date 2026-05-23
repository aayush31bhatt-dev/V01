import { z } from "zod";

export const fileChangeReferenceSchema = z.object({
  path: z.string().min(1),
  changeKind: z.enum(["created", "updated", "deleted", "renamed"]),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
  diffHunkId: z.string().min(1).optional(),
  summary: z.string().max(500).optional()
});

export const dependencyInstallSchema = z.object({
  manager: z.enum(["pnpm", "npm", "yarn", "bun", "pip", "cargo", "other"]),
  name: z.string().min(1),
  version: z.string().optional()
});

export const historyEntrySchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  runId: z.string().min(1),
  promptId: z.string().min(1).optional(),
  prompt: z.string().optional(),
  filesModified: z.array(fileChangeReferenceSchema),
  dependenciesInstalled: z.array(dependencyInstallSchema),
  logs: z.array(z.string()),
  startedAt: z.string(),
  completedAt: z.string().nullable()
});

export type FileChangeReference = z.infer<typeof fileChangeReferenceSchema>;
export type DependencyInstall = z.infer<typeof dependencyInstallSchema>;
export type HistoryEntry = z.infer<typeof historyEntrySchema>;

