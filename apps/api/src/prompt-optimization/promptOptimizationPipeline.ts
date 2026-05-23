import type { RepositoryContext } from "../repository/repositoryScanner";

export interface PromptOptimizationInput {
  prompt: string;
  normalizedPrompt: string;
  recentHistory?: string[];
  context: RepositoryContext;
  sessionId?: string;
}

export interface PromptOptimizationResult {
  prompt: string;
  normalizedPrompt: string;
  recentHistory?: string[];
  context: RepositoryContext;
  strategy: "baseline";
}

export interface PromptOptimizationHook {
  prepare(input: PromptOptimizationInput): Promise<PromptOptimizationResult>;
}

export class BaselinePromptOptimizationPipeline implements PromptOptimizationHook {
  async prepare(input: PromptOptimizationInput): Promise<PromptOptimizationResult> {
    return {
      ...input,
      strategy: "baseline"
    };
  }
}

export const promptOptimizationPipeline = new BaselinePromptOptimizationPipeline();
