export interface ExecutionPlanStep {
  id: string;
  taskId: string;
  label: string;
  prompt: string;
  checkpointAfter: boolean;
}

export interface ExecutionPlan {
  taskId: string;
  steps: ExecutionPlanStep[];
}

