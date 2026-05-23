import { aiPlanSchema, type AIPlan } from "../schemas/promptExecution";
import type { RepositoryContext } from "../repository/repositoryScanner";

export interface AttachmentInput {
  id: string;
  name: string;
  type: "file" | "image";
  mimeType: string;
  content: string;
  size: number;
}

export interface GeneratePlanInput {
  prompt: string;
  normalizedPrompt: string;
  context: RepositoryContext;
  recentHistory?: string[];
  attachments?: AttachmentInput[];
}

export interface AIProvider {
  readonly name: string;
  generatePlan(input: GeneratePlanInput): Promise<AIPlan>;
}

export function parsePlanJson(raw: string): AIPlan {
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  const candidate = jsonStart >= 0 && jsonEnd >= jsonStart ? raw.slice(jsonStart, jsonEnd + 1) : raw;
  return aiPlanSchema.parse(JSON.parse(candidate));
}

export function buildStructuredPlanPrompt(input: GeneratePlanInput): string {
  return [
    "You are v01, a helpful AI coding assistant inside an IDE.",
    "You respond directly to the user in first person. You are friendly, concise, and helpful.",
    "Return only strict JSON. Do not wrap it in Markdown.",
    "The JSON shape is:",
    `{"title":"string","summary":"string","tasks":[{"id":"task_1","title":"string"}],"fileActions":[{"taskId":"task_1","filePath":"relative/path.tsx","action":"create|update","content":"file content","summary":"string"}],"explanation":"string"}`,
    "",
    "IMPORTANT rules for the 'summary' field:",
    "- Write it as a direct first-person reply to the user (e.g. 'I created a login page with...' or 'Here's what I did...').",
    "- Never write in third person (never 'Provides...', 'Creates...', 'Acknowledges...').",
    "- If the user is just chatting (no code task), still respond naturally in the summary field. Use empty tasks and fileActions arrays.",
    "",
    "Rules for file actions:",
    "- Use relative paths only.",
    "- Keep files small and demo-safe.",
    "- Prefer creating feature-scoped files instead of touching project infrastructure.",
    "- Never request shell commands.",
    "- If the user's message doesn't require code changes, return empty tasks and fileActions arrays.",
    "",
    ...(input.recentHistory?.length ? [
      "Recent conversation history:",
      ...input.recentHistory.map(h => `- ${h}`),
      ""
    ] : []),
    `User message: ${input.normalizedPrompt}`,
    "",
    `Repository files:\n${input.context.files.slice(0, 80).join("\n") || "(no repository context)"}`
  ].join("\n");
}
