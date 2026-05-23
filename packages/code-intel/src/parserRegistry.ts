export interface ParserRegistration {
  language: string;
  extensions: string[];
  parserName: "tree-sitter" | "ts-morph" | "custom";
}

export class ParserRegistry {
  private readonly registrations = new Map<string, ParserRegistration>();

  register(registration: ParserRegistration): void {
    for (const extension of registration.extensions) {
      this.registrations.set(extension, registration);
    }
  }

  findByExtension(extension: string): ParserRegistration | undefined {
    return this.registrations.get(extension);
  }
}

