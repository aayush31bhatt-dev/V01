import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { executionRuns } from "./execution";
import { prompts, tasks } from "./tasks";

export const historyEntries = sqliteTable("history_entries", {
  id: text("id").primaryKey(),
  taskId: text("task_id")
    .notNull()
    .references(() => tasks.id),
  runId: text("run_id")
    .notNull()
    .references(() => executionRuns.id),
  promptId: text("prompt_id").references(() => prompts.id),
  promptSnapshot: text("prompt_snapshot"),
  dependenciesJson: text("dependencies_json").notNull().default("[]"),
  logsJson: text("logs_json").notNull().default("[]"),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at")
});

export const historyFileChanges = sqliteTable("history_file_changes", {
  id: text("id").primaryKey(),
  historyEntryId: text("history_entry_id")
    .notNull()
    .references(() => historyEntries.id),
  path: text("path").notNull(),
  changeKind: text("change_kind", {
    enum: ["created", "updated", "deleted", "renamed"]
  }).notNull(),
  startLine: integer("start_line"),
  endLine: integer("end_line"),
  diffHunkId: text("diff_hunk_id"),
  summary: text("summary")
});

