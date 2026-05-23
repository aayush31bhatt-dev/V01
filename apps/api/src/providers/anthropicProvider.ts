import type { AIPlan } from "../schemas/promptExecution";
import { buildStructuredPlanPrompt, parsePlanJson, type AIProvider, type GeneratePlanInput } from "./aiProvider";

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async generatePlan(input: GeneratePlanInput): Promise<AIPlan> {
    if (!this.apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured.");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 6000,
        temperature: 0.2,
        messages: [{ role: "user", content: buildStructuredPlanPrompt(input) }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed with ${response.status}.`);
    }

    const payload = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = payload.content?.map((part) => part.text ?? "").join("\n") ?? "";
    return parsePlanJson(text);
  }
}
