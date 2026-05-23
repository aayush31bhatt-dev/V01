import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import type { PromptExecutionEvent } from "@v01/core";
import { realtimeHub } from "../realtime/realtimeHub";
import { PromptPipeline } from "../pipeline/promptPipeline";
import { createAIProvider } from "../providers/providerFactory";
import {
  type AIFileAction,
  type ChatSessionMessageDto,
  type CreatePromptSessionInput,
  type PromptFileDto,
  type PromptSessionDto,
  type PromptTaskDto
} from "../schemas/promptExecution";
import { applyFileAction, inferLanguageFromPath } from "../workspace/fileEngine";
import { env } from "../env";
import { executionCoordinator } from "../services/executionCoordinator";
import { localPersistence } from "../persistence/localPersistence";

const clusterAccents = ["#75D1B3", "#F2A65A", "#8BD3FF", "#D9B66F", "#B7E08A", "#F58CA8"];
const taskPositions = [
  { x: 24, y: 62 },
  { x: 154, y: 62 },
  { x: 284, y: 62 },
  { x: 154, y: 124 },
  { x: 24, y: 124 }
] as const;
const filePositions = [
  { x: 22, y: 222 },
  { x: 154, y: 242 },
  { x: 286, y: 222 },
  { x: 154, y: 294 },
  { x: 22, y: 294 }
] as const;

function now(): string {
  return new Date().toISOString();
}

function createMessage(
  role: ChatSessionMessageDto["role"],
  content: string,
  status: ChatSessionMessageDto["status"] = "complete",
  id: string = randomUUID(),
  sourceSessionId?: string
): ChatSessionMessageDto {
  return {
    id,
    role,
    content,
    createdAt: now(),
    status,
    sourceSessionId
  };
}

function previewFromContent(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function kindFromAction(action: AIFileAction["action"], appliedKind?: "created" | "modified"): PromptFileDto["kind"] {
  if (appliedKind) {
    return appliedKind;
  }
  return action === "create" ? "created" : "modified";
}

function progressFor(tasks: PromptTaskDto[]): number {
  if (!tasks.length) {
    return 0;
  }
  return Math.round((tasks.filter((task) => task.status === "completed").length / tasks.length) * 100);
}

class PromptExecutionOrchestrator {
  private readonly sessions = new Map<string, PromptSessionDto>();
  private readonly sessionProjectIds = new Map<string, string>();
  private initializePromise: Promise<void> | null = null;

  private createPipeline(modelOverride?: string): PromptPipeline {
    return new PromptPipeline(createAIProvider(modelOverride));
  }

  async initialize(): Promise<void> {
    this.initializePromise ??= this.loadPersistedState();
    await this.initializePromise;
  }

  async createSession(input: CreatePromptSessionInput): Promise<PromptSessionDto> {
    await this.initialize();
    const persistence = await localPersistence();
    const project = await persistence.projects.getOrCreateProject({
      rootPath: input.workspaceRoot ?? null
    });
    const createdAt = now();
    const id = input.clientSessionId ?? randomUUID();
    const existing = this.sessions.get(id);
    const userMessage = createMessage("user", input.prompt, "complete", input.clientMessageId ?? randomUUID());
    const session: PromptSessionDto = existing
      ? {
          ...existing,
          summary: "Preparing workspace context and task breakdown.",
          content: input.prompt,
          status: "pending",
          progress: Math.max(existing.progress, 4),
          updatedAt: createdAt,
          completedAt: null,
          messages: existing.messages.some((message) => message.id === userMessage.id)
            ? existing.messages
            : [...existing.messages, userMessage],
          history: [...existing.history, "Prompt accepted by API"].slice(-40)
        }
      : {
          id,
          title: "Planning prompt",
          originalPrompt: input.prompt,
          summary: "Preparing workspace context and task breakdown.",
          content: input.prompt,
          messages: [userMessage],
          x: input.position?.x ?? 0,
          y: input.position?.y ?? 0,
          zoom: 1,
          status: "pending",
          progress: 0,
          createdAt,
          updatedAt: createdAt,
          completedAt: null,
          accent: clusterAccents[this.sessions.size % clusterAccents.length] ?? "#75D1B3",
          expanded: true,
          activeTaskId: null,
          selectedFileId: null,
          history: ["Prompt accepted by API", "Execution session created"],
          tasks: [],
          files: []
        };

    this.sessions.set(id, session);
    this.sessionProjectIds.set(id, project.id);
    await this.persist(session);
    await persistence.execution.recordEvent({
      projectId: project.id,
      sessionId: id,
      kind: "session.prompt.accepted",
      status: "queued",
      originalPrompt: input.prompt,
      message: "Prompt accepted by API"
    });
    this.publish("CARD_CREATED", session);

    void this.execute(id, input).catch((error) => {
      console.error("Session execution failed:", error);
      this.failSession(id, error instanceof Error ? error.message : "Unknown execution error");
    });

    return session;
  }

  async listSessions(): Promise<PromptSessionDto[]> {
    await this.initialize();
    return [...this.sessions.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async listHistory(): Promise<PromptSessionDto[]> {
    await this.initialize();
    return this.listSessions();
  }

  private async execute(sessionId: string, input: CreatePromptSessionInput): Promise<void> {
    this.updateSession(sessionId, (session) => ({
      ...session,
      status: "running",
      summary: "Building context and asking the provider for structured tasks.",
      updatedAt: now(),
      history: [...session.history, "Prompt pipeline started"]
    }));
    await this.recordEvent(sessionId, {
      kind: "execution.started",
      status: "running",
      originalPrompt: input.prompt,
      message: "Prompt pipeline started"
    });

    const pipelineResult = await this.createPipeline(input.model).run(input);
    const taskIdMap = new Map<string, string>();
    const tasks = pipelineResult.plan.tasks.map<PromptTaskDto>((task, index) => {
      const id = randomUUID();
      taskIdMap.set(task.id, id);
      const position = taskPositions[index] ?? taskPositions[taskPositions.length - 1] ?? { x: 24, y: 62 };
      return {
        id,
        title: task.title,
        status: "pending",
        x: position.x,
        y: position.y,
        linkedFileIds: [],
        startedAt: null,
        completedAt: null,
        expanded: index === 0,
        metadata: task.description ?? "Generated by prompt pipeline",
        log: ["Task created from structured AI output."]
      };
    });

    this.updateSession(sessionId, (session) => ({
      ...session,
      title: pipelineResult.plan.title,
      summary: pipelineResult.plan.summary,
      content: pipelineResult.normalizedPrompt,
      tasks,
      activeTaskId: tasks[0]?.id ?? null,
      updatedAt: now(),
      history: [...session.history, "Structured task breakdown received"]
    }));
    await this.recordAIResponse(sessionId, {
      prompt: input.prompt,
      normalizedPrompt: pipelineResult.normalizedPrompt,
      response: pipelineResult.plan.explanation ?? pipelineResult.plan.summary,
      raw: pipelineResult.plan
    });
    await this.recordEvent(sessionId, {
      kind: "execution.plan.created",
      status: "completed",
      originalPrompt: input.prompt,
      message: "Structured task breakdown received",
      payload: {
        taskCount: tasks.length,
        fileActionCount: pipelineResult.plan.fileActions.length
      }
    });

    for (const task of tasks) {
      this.publish("TASK_CREATED", this.requireSession(sessionId), { task });
    }

    for (const task of tasks) {
      if (executionCoordinator.shouldPause()) {
        this.updateSession(sessionId, (session) => ({
          ...session,
          status: "paused",
          updatedAt: now(),
          history: [...session.history, "Paused at safe checkpoint"]
        }));
        await this.recordEvent(sessionId, {
          kind: "execution.paused",
          status: "paused",
          message: "Paused at safe checkpoint"
        });
        this.publish("EXECUTION_PAUSED", this.requireSession(sessionId));
        return;
      }

      this.markTaskStarted(sessionId, task.id);
      const providerTaskId = [...taskIdMap.entries()].find(([, mappedId]) => mappedId === task.id)?.[0];
      const actions = pipelineResult.plan.fileActions.filter((action) => action.taskId === providerTaskId);

      for (const action of actions) {
        const applied = await applyFileAction(input.workspaceRoot ?? null, action);
        const file = this.createFileDto(action, applied, task.id, this.requireSession(sessionId).files.length);
        this.updateSession(sessionId, (session) => ({
          ...session,
          files: [...session.files, file],
          tasks: session.tasks.map((candidate) =>
            candidate.id === task.id
              ? {
                  ...candidate,
                  linkedFileIds: [...new Set([...candidate.linkedFileIds, file.id])],
                  log: [...candidate.log, `${applied.changeKind === "created" ? "Created" : "Updated"} ${applied.relativePath}`]
                }
              : candidate
          ),
          updatedAt: now(),
          history: [...session.history, `${applied.changeKind === "created" ? "Created" : "Updated"} ${applied.relativePath}`]
        }));
        await this.recordEvent(sessionId, {
          taskId: task.id,
          kind: applied.changeKind === "created" ? "file.created" : "file.updated",
          status: "completed",
          message: `${applied.changeKind === "created" ? "Created" : "Updated"} ${applied.relativePath}`,
          fileChanges: [
            {
              path: applied.relativePath,
              changeKind: applied.changeKind,
              summary: applied.summary
            }
          ]
        });
        this.publish(applied.changeKind === "created" ? "FILE_CREATED" : "FILE_UPDATED", this.requireSession(sessionId), {
          file
        });
        this.publish("FILE_LINKED", this.requireSession(sessionId), { file, task });
      }

      this.markTaskCompleted(sessionId, task.id);
    }

    this.updateSession(sessionId, (session) => ({
      ...session,
      status: "completed",
      progress: 100,
      activeTaskId: null,
      completedAt: now(),
      updatedAt: now(),
      messages: [
        ...session.messages,
        createMessage("assistant", pipelineResult.plan.summary, "complete", randomUUID(), sessionId)
      ],
      history: [...session.history, "Execution completed"]
    }));
    await this.recordEvent(sessionId, {
      kind: "execution.completed",
      status: "completed",
      originalPrompt: input.prompt,
      message: "Execution completed"
    });
    this.publish("EXECUTION_DONE", this.requireSession(sessionId));
  }

  private createFileDto(
    action: AIFileAction,
    applied: Awaited<ReturnType<typeof applyFileAction>>,
    taskId: string,
    index: number
  ): PromptFileDto {
    const position = filePositions[index] ?? filePositions[filePositions.length - 1] ?? { x: 22, y: 222 };
    const name = basename(applied.relativePath);
    return {
      id: action.id ?? randomUUID(),
      name,
      path: applied.absolutePath,
      relativePath: applied.relativePath,
      kind: kindFromAction(action.action, applied.changeKind),
      previewKind: inferLanguageFromPath(applied.relativePath) === "css" ? "stack" : "code",
      preview: previewFromContent(applied.content),
      language: inferLanguageFromPath(applied.relativePath),
      mockContent: applied.content,
      x: position.x,
      y: position.y,
      changeSummary: `${applied.summary} (${taskId})`
    };
  }

  private markTaskStarted(sessionId: string, taskId: string): void {
    const startedAt = now();
    this.updateSession(sessionId, (session) => ({
      ...session,
      status: "running",
      activeTaskId: taskId,
      updatedAt: startedAt,
      tasks: session.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "running",
              startedAt,
              expanded: true,
              log: [...task.log, "Started execution."]
            }
          : task
      ),
      history: [...session.history, `${session.tasks.find((task) => task.id === taskId)?.title ?? "Task"} started`]
    }));
    this.publish("TASK_STARTED", this.requireSession(sessionId), {
      task: this.requireSession(sessionId).tasks.find((task) => task.id === taskId)
    });
  }

  private markTaskCompleted(sessionId: string, taskId: string): void {
    const completedAt = now();
    this.updateSession(sessionId, (session) => {
      const tasks = session.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "completed" as const,
              completedAt,
              log: [...task.log, "Completed at safe checkpoint."]
            }
          : task
      );
      return {
        ...session,
        progress: progressFor(tasks),
        updatedAt: completedAt,
        tasks,
        history: [...session.history, `${session.tasks.find((task) => task.id === taskId)?.title ?? "Task"} completed`]
      };
    });
    this.publish("TASK_COMPLETED", this.requireSession(sessionId), {
      task: this.requireSession(sessionId).tasks.find((task) => task.id === taskId)
    });
  }

  private failSession(sessionId: string, message: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }
    this.updateSession(sessionId, (current) => ({
      ...current,
      status: "error",
      updatedAt: now(),
      messages: [...current.messages, createMessage("assistant", message, "error", randomUUID(), sessionId)],
      history: [...current.history, `Error: ${message}`]
    }));
    void this.recordEvent(sessionId, {
      kind: "execution.error",
      status: "error",
      message,
      error: message
    });
    this.publish("EXECUTION_ERROR", this.requireSession(sessionId), { error: message });
  }

  private updateSession(sessionId: string, updater: (session: PromptSessionDto) => PromptSessionDto): void {
    const next = updater(this.requireSession(sessionId));
    this.sessions.set(sessionId, next);
    void this.persist(next);
    this.publish("CARD_UPDATED", next);
  }

  private requireSession(sessionId: string): PromptSessionDto {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Unknown prompt session: ${sessionId}`);
    }
    return session;
  }

  private publish(type: PromptExecutionEvent["type"], session: PromptSessionDto, extra: Partial<PromptExecutionEvent> = {}): void {
    realtimeHub.publish({
      type,
      sessionId: session.id,
      at: now(),
      session,
      ...extra
    });
  }

  private async persist(session: PromptSessionDto): Promise<void> {
    const persistence = await localPersistence();
    const projectId = this.sessionProjectIds.get(session.id) ?? (await persistence.projects.getLatestProject()).id;
    await persistence.sessions.save(projectId, session);
  }

  private async loadPersistedState(): Promise<void> {
    const snapshot = await (await localPersistence()).workspace.loadLatestSnapshot();
    this.sessions.clear();
    this.sessionProjectIds.clear();
    for (const session of snapshot.sessions) {
      this.sessions.set(session.id, session);
      this.sessionProjectIds.set(session.id, snapshot.project.id);
    }
  }

  private async recordAIResponse(
    sessionId: string,
    input: {
      prompt: string;
      normalizedPrompt: string;
      response: string;
      raw: Record<string, unknown>;
    }
  ): Promise<string | null> {
    const persistence = await localPersistence();
    const projectId = this.sessionProjectIds.get(sessionId);
    if (!projectId) {
      return null;
    }

    return persistence.execution.recordAIResponse({
      projectId,
      sessionId,
      provider: env.aiProvider,
      model:
        env.aiProvider === "openai"
          ? env.openAiModel
          : env.aiProvider === "anthropic"
            ? env.anthropicModel
            : env.aiProvider === "gemini"
              ? env.geminiModel
              : "mock",
      prompt: input.prompt,
      normalizedPrompt: input.normalizedPrompt,
      response: input.response,
      raw: input.raw
    });
  }

  private async recordEvent(
    sessionId: string,
    input: {
      kind: string;
      status: string;
      taskId?: string | null;
      originalPrompt?: string | null;
      message?: string | null;
      payload?: Record<string, unknown>;
      fileChanges?: unknown[];
      error?: string | null;
    }
  ): Promise<void> {
    const persistence = await localPersistence();
    const projectId = this.sessionProjectIds.get(sessionId);
    if (!projectId) {
      return;
    }

    await persistence.execution.recordEvent({
      projectId,
      sessionId,
      taskId: input.taskId,
      kind: input.kind,
      status: input.status,
      originalPrompt: input.originalPrompt,
      message: input.message,
      payload: input.payload,
      fileChanges: input.fileChanges,
      error: input.error
    });
  }
}

export const promptExecutionOrchestrator = new PromptExecutionOrchestrator();
