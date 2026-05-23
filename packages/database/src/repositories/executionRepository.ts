import type { PrismaClient } from "../generated/prisma/client";
import { parseDate, stringifyJson } from "./json";
import type { RecordAIResponseInput, RecordExecutionEventInput } from "./types";

export class ExecutionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async recordAIResponse(input: RecordAIResponseInput): Promise<string> {
    const response = await this.prisma.aIResponse.create({
      data: {
        projectId: input.projectId,
        sessionId: input.sessionId,
        taskId: input.taskId ?? null,
        provider: input.provider,
        model: input.model,
        prompt: input.prompt,
        normalizedPrompt: input.normalizedPrompt ?? null,
        response: input.response,
        status: input.status ?? "complete",
        inputTokens: input.inputTokens ?? null,
        outputTokens: input.outputTokens ?? null,
        rawJson: stringifyJson(input.raw ?? {}),
        createdAt: new Date()
      }
    });

    return response.id;
  }

  async recordEvent(input: RecordExecutionEventInput): Promise<string> {
    const event = await this.prisma.executionEvent.create({
      data: {
        projectId: input.projectId,
        sessionId: input.sessionId ?? null,
        taskId: input.taskId ?? null,
        aiResponseId: input.aiResponseId ?? null,
        kind: input.kind,
        status: input.status,
        originalPrompt: input.originalPrompt ?? null,
        message: input.message ?? null,
        payloadJson: stringifyJson(input.payload ?? {}),
        fileChangesJson: stringifyJson(input.fileChanges ?? [], "[]"),
        error: input.error ?? null,
        startedAt: parseDate(input.startedAt),
        completedAt: parseDate(input.completedAt),
        createdAt: new Date()
      }
    });

    return event.id;
  }
}
