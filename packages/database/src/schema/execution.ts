import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { tasks } from "./tasks";

export const executionRuns = sqliteTable("execution_runs", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  status: text("status", {
    enum: ["queued", "running", "pause_requested", "paused", "completed", "failed"]
  }).notNull(),
  currentCheckpointId: text("current_checkpoint_id"),
  pauseRequested: integer("pause_requested", { mode: "boolean" }).notNull().default(false),
  startedAt: text("started_at"),
  completedAt: text("completed_at")
});

export const executionCheckpoints = sqliteTable("execution_checkpoints", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => executionRuns.id),
  kind: text("kind", {
    enum: [
      "after_prompt",
      "after_file_changes",
      "after_dependency_install",
      "after_build",
      "after_tests",
      "manual_review"
    ]
  }).notNull(),
  label: text("label").notNull(),
  safeToPause: integer("safe_to_pause", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull()
});

