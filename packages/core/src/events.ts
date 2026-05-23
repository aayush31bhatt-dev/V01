import type { TaskStatus } from "./domain/task";

export type PromptExecutionEventType =
  | "CARD_CREATED"
  | "CARD_UPDATED"
  | "TASK_CREATED"
  | "TASK_STARTED"
  | "TASK_COMPLETED"
  | "FILE_CREATED"
  | "FILE_UPDATED"
  | "FILE_LINKED"
  | "EXECUTION_PAUSED"
  | "EXECUTION_RESUMED"
  | "EXECUTION_DONE"
  | "EXECUTION_ERROR";

export type PromptExecutionEvent = {
  type: PromptExecutionEventType;
  sessionId: string;
  at: string;
  session?: unknown;
  task?: unknown;
  file?: unknown;
  error?: string;
};

export type DomainEvent =
  | {
      type: "task.created";
      taskId: string;
      at: string;
    }
  | {
      type: "task.status_changed";
      taskId: string;
      status: TaskStatus;
      at: string;
    }
  | {
      type: "execution.pause_requested";
      nextCheckpoint: string | null;
      at: string;
    }
  | {
      type: "history.entry_created";
      historyEntryId: string;
      taskId: string;
      at: string;
    }
  | PromptExecutionEvent;
