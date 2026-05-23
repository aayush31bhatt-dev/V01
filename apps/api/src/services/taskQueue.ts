import { randomUUID } from "node:crypto";
import type { CreateTaskInput, TaskItem } from "@v01/core";

class TaskQueue {
  private readonly tasks: TaskItem[] = [];

  list(): TaskItem[] {
    return this.tasks;
  }

  create(input: CreateTaskInput): TaskItem {
    const now = new Date().toISOString();
    const task: TaskItem = {
      id: randomUUID(),
      title: input.title,
      description: input.description,
      source: input.source ?? "text",
      status: "pending",
      priority: input.priority ?? 3,
      createdAt: now,
      updatedAt: now
    };

    this.tasks.unshift(task);
    return task;
  }
}

export const taskQueue = new TaskQueue();

