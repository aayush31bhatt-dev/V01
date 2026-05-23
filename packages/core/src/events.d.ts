import type { TaskStatus } from "./domain/task";
export type DomainEvent = {
    type: "task.created";
    taskId: string;
    at: string;
} | {
    type: "task.status_changed";
    taskId: string;
    status: TaskStatus;
    at: string;
} | {
    type: "execution.pause_requested";
    nextCheckpoint: string | null;
    at: string;
} | {
    type: "history.entry_created";
    historyEntryId: string;
    taskId: string;
    at: string;
};
//# sourceMappingURL=events.d.ts.map