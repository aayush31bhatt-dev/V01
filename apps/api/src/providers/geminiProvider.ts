import type { AIPlan } from "../schemas/promptExecution";
import { buildStructuredPlanPrompt, parsePlanJson, type AIProvider, type GeneratePlanInput } from "./aiProvider";

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  constructor(
    private readonly apiKey: string,
    private readonly model: string
  ) {}

  async generatePlan(input: GeneratePlanInput): Promise<AIPlan> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const prompt = buildStructuredPlanPrompt(input);
    const parts: GeminiPart[] = [];

    // Add file attachments as text context
    if (input.attachments?.length) {
      for (const attachment of input.attachments) {
        if (attachment.type === "image") {
          parts.push({
            inline_data: {
              mime_type: attachment.mimeType,
              data: attachment.content
            }
          });
        } else {
          parts.push({
            text: `[Attached file: ${attachment.name}]\n${attachment.content}`
          });
        }
      }
    }

    // Add the main prompt text last
    parts.push({ text: prompt });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini request failed with ${response.status}: ${errText}`);
    }

    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return parsePlanJson(text);
  }
}
