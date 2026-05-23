import type { TaskItem } from "@v01/core";
import type { ExecutionPlan } from "./execution/plan";
import { PromptOptimizer } from "./promptOptimizer/promptOptimizer";

export class AIOrchestrator {
  constructor(private readonly promptOptimizer = new PromptOptimizer()) {}

  async createExecutionPlan(task: TaskItem): Promise<ExecutionPlan> {
    const optimizedPrompt = await this.promptOptimizer.optimize({
      taskTitle: task.title,
      taskDescription: task.description
    });

    return {
      taskId: task.id,
      steps: [
        {
          id: `${task.id}:plan`,
          taskId: task.id,
          label: "Baseline planning step",
          prompt: optimizedPrompt.content,
          checkpointAfter: true
        }
      ]
    };
  }
}

