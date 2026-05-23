export interface OpenAIAdapterConfig {
  apiKey: string;
  model: string;
}

export class OpenAIAdapter {
  constructor(private readonly config: OpenAIAdapterConfig) {}

  get model(): string {
    return this.config.model;
  }

  async generateText(_prompt: string): Promise<string> {
    // Future: call the OpenAI API here through the official SDK.
    // Keep provider response shaping inside this adapter.
    throw new Error("OpenAIAdapter.generateText is not implemented yet.");
  }
}

