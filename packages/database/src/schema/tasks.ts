import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  parentId: text("parent_id"),
  title: text("title").notNull(),
  description: text("description"),
  source: text("source", { enum: ["voice", "text", "system"] }).notNull(),
  status: text("status", {
    enum: [
      "pending",
      "planning",
      "ready",
      "running",
      "checkpoint",
      "pause_requested",
      "paused",
      "completed",
      "failed"
    ]
  }).notNull(),
  priority: integer("priority").notNull().default(3),
  optimizedPromptId: text("optimized_prompt_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const prompts = sqliteTable("prompts", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  provider: text("provider", { enum: ["openai", "anthropic", "custom", "system"] }).notNull(),
  model: text("model").notNull(),
  content: text("content").notNull(),
  tokenEstimate: integer("token_estimate"),
  strategy: text("strategy").notNull().default("baseline"),
  createdAt: text("created_at").notNull()
});

