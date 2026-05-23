export interface AnthropicAdapterConfig {
  apiKey: string;
  model: string;
}

export class AnthropicAdapter {
  constructor(private readonly config: AnthropicAdapterConfig) {}

  get model(): string {
    return this.config.model;
  }

  async generateText(_prompt: string): Promise<string> {
    // Future: call the Anthropic API here through the official SDK.
    // The orchestration layer should not depend on provider-specific shapes.
    throw new Error("AnthropicAdapter.generateText is not implemented yet.");
  }
}

