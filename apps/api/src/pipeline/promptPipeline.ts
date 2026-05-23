import type { AIProvider } from "../providers/aiProvider";
import { promptOptimizationPipeline } from "../prompt-optimization/promptOptimizationPipeline";
import { scanRepository } from "../repository/repositoryScanner";
import type { AIPlan, CreatePromptSessionInput } from "../schemas/promptExecution";

export interface PromptPipelineResult {
  normalizedPrompt: string;
  plan: AIPlan;
}

export class PromptPipeline {
  constructor(private readonly provider: AIProvider) {}

  async run(input: CreatePromptSessionInput): Promise<PromptPipelineResult> {
    const normalizedPrompt = this.normalizePrompt(input.prompt);
    const context = await scanRepository(input.workspaceRoot ?? null);
    const optimized = await promptOptimizationPipeline.prepare({
      prompt: input.prompt,
      normalizedPrompt,
      context,
      recentHistory: input.recentHistory,
      sessionId: input.clientSessionId
    });

    const plan = await this.provider.generatePlan({
      prompt: optimized.prompt,
      normalizedPrompt: optimized.normalizedPrompt,
      context: optimized.context,
      recentHistory: optimized.recentHistory,
      attachments: input.attachments
    });

    return {
      normalizedPrompt: optimized.normalizedPrompt,
      plan
    };
  }

  private normalizePrompt(prompt: string): string {
    return prompt.replace(/\s+/g, " ").trim();
  }
}
