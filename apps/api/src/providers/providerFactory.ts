import { env } from "../env";
import type { AIProvider } from "./aiProvider";
import { AnthropicProvider } from "./anthropicProvider";
import { MockAIProvider } from "./mockProvider";
import { OpenAIProvider } from "./openAiProvider";
import { GeminiProvider } from "./geminiProvider";

export function createAIProvider(modelOverride?: string): AIProvider {
  if (env.aiProvider === "gemini" && env.geminiApiKey) {
    return new GeminiProvider(env.geminiApiKey, modelOverride || env.geminiModel);
  }

  if (env.aiProvider === "openai" && env.openAiApiKey) {
    return new OpenAIProvider(env.openAiApiKey, modelOverride || env.openAiModel);
  }

  if (env.aiProvider === "anthropic" && env.anthropicApiKey) {
    return new AnthropicProvider(env.anthropicApiKey, modelOverride || env.anthropicModel);
  }

  return new MockAIProvider();
}
