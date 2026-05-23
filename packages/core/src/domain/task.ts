import { z } from "zod";

export const taskSourceSchema = z.enum(["voice", "text", "system"]);

export const taskStatusSchema = z.enum([
  "pending",
  "planning",
  "ready",
  "running",
  "checkpoint",
  "pause_requested",
  "paused",
  "completed",
  "failed"
]);

export const createTaskInputSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  source: taskSourceSchema.default("text"),
  priority: z.number().int().min(1).max(5).default(3)
});

export const taskItemSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().min(1).optional(),
  title: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  source: taskSourceSchema,
  status: taskStatusSchema,
  priority: z.number().int().min(1).max(5),
  optimizedPromptId: z.string().min(1).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type TaskSource = z.infer<typeof taskSourceSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type TaskItem = z.infer<typeof taskItemSchema>;

