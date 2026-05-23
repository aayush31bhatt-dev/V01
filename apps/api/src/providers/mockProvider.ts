import type { AIPlan, AIFileAction } from "../schemas/promptExecution";
import type { AIProvider, GeneratePlanInput } from "./aiProvider";

function titleFromPrompt(prompt: string): string {
  return prompt
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(" ") || "Generated workspace";
}

function toPascalCase(value: string): string {
  const words = value.replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean).slice(0, 3);
  return words.map((word) => word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase()).join("") || "Generated";
}

export class MockAIProvider implements AIProvider {
  readonly name = "mock";

  async generatePlan(input: GeneratePlanInput): Promise<AIPlan> {
    const lower = input.normalizedPrompt.toLowerCase();
    const componentName = toPascalCase(input.normalizedPrompt);
    const title = titleFromPrompt(input.normalizedPrompt);
    const isLogin = lower.includes("login") || lower.includes("auth");
    const isDashboard = lower.includes("dashboard") || lower.includes("analytics");
    const baseDir = isLogin ? "src/pages" : isDashboard ? "src/dashboard" : "src/generated";
    const stylePath = isLogin ? "src/styles/auth.css" : `${baseDir}/${componentName}.css`;
    const primaryPath = `${baseDir}/${componentName}.tsx`;
    const helperPath = isLogin ? "src/lib/auth.ts" : `${baseDir}/${componentName}.model.ts`;

    const tasks = [
      { id: "task_1", title: isLogin ? "Create login UI" : "Create primary interface" },
      { id: "task_2", title: isLogin ? "Set up auth helpers" : "Add state model" },
      { id: "task_3", title: "Apply styling and interaction states" }
    ];

    const fileActions: AIFileAction[] = [
      {
        taskId: "task_1",
        filePath: primaryPath,
        action: "create",
        summary: "Create the main UI surface.",
        content: [
          `export function ${componentName}() {`,
          "  return (",
          "    <main className=\"v01-generated-surface\">",
          `      <h1>${title}</h1>`,
          `      <p>${input.normalizedPrompt}</p>`,
          "      <button type=\"button\">Continue</button>",
          "    </main>",
          "  );",
          "}",
          ""
        ].join("\n")
      },
      {
        taskId: "task_2",
        filePath: helperPath,
        action: "create",
        summary: "Create a typed helper/model boundary.",
        content: [
          `export const ${componentName.charAt(0).toLowerCase()}${componentName.slice(1)}Plan = {`,
          `  title: "${title}",`,
          `  sourcePrompt: ${JSON.stringify(input.normalizedPrompt)},`,
          "  generatedBy: \"v01 mock provider\"",
          "};",
          ""
        ].join("\n")
      },
      {
        taskId: "task_3",
        filePath: stylePath,
        action: "create",
        summary: "Add focused styling for the generated surface.",
        content: [
          ".v01-generated-surface {",
          "  display: grid;",
          "  gap: 16px;",
          "  max-width: 720px;",
          "  padding: 32px;",
          "  border-radius: 20px;",
          "}",
          "",
          ".v01-generated-surface button {",
          "  width: fit-content;",
          "}",
          ""
        ].join("\n")
      }
    ];

    return {
      title,
      summary: `Generated a safe execution plan for: ${input.normalizedPrompt}`,
      tasks,
      fileActions,
      explanation: "Mock provider used because no AI provider key is configured."
    };
  }
}
