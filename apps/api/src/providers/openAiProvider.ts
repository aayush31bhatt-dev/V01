import type { AIPlan } from "../schemas/promptExecution";
import { buildStructuredPlanPrompt, parsePlanJson, type AIProvider, type GeneratePlanInput } from "./aiProvider";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async generatePlan(input: GeneratePlanInput): Promise<AIPlan> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        input: buildStructuredPlanPrompt(input),
        temperature: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with ${response.status}.`);
    }

    const payload = (await response.json()) as { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };
    const text = payload.output_text ?? payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("\n") ?? "";
    return parsePlanJson(text);
  }
}
