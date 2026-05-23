import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

export const env = {
  apiHost: process.env.V01_API_HOST ?? "127.0.0.1",
  apiPort: Number(process.env.V01_API_PORT ?? 4310),
  sqlitePath: process.env.V01_SQLITE_PATH ?? "./data/v01.db",
  aiProvider: process.env.V01_AI_PROVIDER ?? "mock",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-3.1-pro"
};
