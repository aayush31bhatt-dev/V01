import type { Prisma, PrismaClient } from "../generated/prisma/client";
import { parseDate, parseJson, stringifyJson, toIso } from "./json";
import type {
  PersistedFileArtifact,
  PersistedMessage,
  PersistedSession,
  PersistedTask
} from "./types";

type SessionWithChildren = Prisma.SessionGetPayload<{
  include: {
    messages: true;
    tasks: true;
    fileArtifacts: true;
  };
}>;

function dateOrNow(value: string | null | undefined): Date {
  return parseDate(value) ?? new Date();
}

function nullableDate(value: string | null | undefined): Date | null {
  return parseDate(value);
}

function taskIdForFile(session: PersistedSession, fileId: string): string | null {
  return session.tasks.find((task) => task.linkedFileIds.includes(fileId))?.id ?? null;
}

function mapMessage(message: SessionWithChildren["messages"][number]): PersistedMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    status: message.status,
    sourceSessionId: message.sourceSessionId ?? undefined
  };
}

function mapTask(task: SessionWithChildren["tasks"][number]): PersistedTask {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    x: task.x,
    y: task.y,
    linkedFileIds: parseJson<string[]>(task.linkedFileIdsJson, []),
    startedAt: toIso(task.startedAt),
    completedAt: toIso(task.completedAt),
    expanded: task.expanded,
    metadata: task.metadata,
    log: parseJson<string[]>(task.logJson, [])
  };
}

function mapFile(file: SessionWithChildren["fileArtifacts"][number]): PersistedFileArtifact {
  return {
    id: file.id,
    name: file.name,
    path: file.path,
    relativePath: file.relativePath,
    kind: file.kind,
    previewKind: file.previewKind,
    preview: parseJson<string[]>(file.previewJson, []),
    language: file.language,
    mockContent: file.mockContent,
    x: file.x,
    y: file.y,
    changeSummary: file.changeSummary ?? undefined
  };
}

function mapSession(session: SessionWithChildren): PersistedSession {
  return {
    id: session.id,
    title: session.title,
    originalPrompt: session.originalPrompt,
    summary: session.summary,
    content: session.content,
    messages: [...session.messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(mapMessage),
    x: session.x,
    y: session.y,
    zoom: session.zoom,
    status: session.status,
    progress: session.progress,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    completedAt: toIso(session.completedAt),
    accent: session.accent,
    expanded: session.expanded,
    activeTaskId: session.activeTaskId,
    selectedFileId: session.selectedFileId,
    history: parseJson<string[]>(session.historyJson, []),
    tasks: [...session.tasks].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(mapTask),
    files: [...session.fileArtifacts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(mapFile)
  };
}

export class SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listByProject(projectId: string): Promise<PersistedSession[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        projectId,
        isOpen: true
      },
      orderBy: [{ createdAt: "asc" }],
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        },
        tasks: {
          orderBy: { createdAt: "asc" }
        },
        fileArtifacts: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    return sessions.map(mapSession);
  }

  async save(projectId: string, session: PersistedSession): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.session.upsert({
        where: { id: session.id },
        update: {
          projectId,
          title: session.title,
          originalPrompt: session.originalPrompt,
          summary: session.summary,
          content: session.content,
          status: session.status,
          progress: session.progress,
          x: session.x,
          y: session.y,
          zoom: session.zoom,
          accent: session.accent,
          expanded: session.expanded,
          isOpen: true,
          activeTaskId: session.activeTaskId,
          selectedFileId: session.selectedFileId,
          historyJson: stringifyJson(session.history, "[]"),
          updatedAt: dateOrNow(session.updatedAt),
          completedAt: nullableDate(session.completedAt)
        },
        create: {
          id: session.id,
          projectId,
          title: session.title,
          originalPrompt: session.originalPrompt,
          summary: session.summary,
          content: session.content,
          status: session.status,
          progress: session.progress,
          x: session.x,
          y: session.y,
          zoom: session.zoom,
          accent: session.accent,
          expanded: session.expanded,
          isOpen: true,
          activeTaskId: session.activeTaskId,
          selectedFileId: session.selectedFileId,
          historyJson: stringifyJson(session.history, "[]"),
          createdAt: dateOrNow(session.createdAt),
          updatedAt: dateOrNow(session.updatedAt),
          completedAt: nullableDate(session.completedAt)
        }
      });

      await this.saveMessages(tx, session);
      await this.saveTasks(tx, projectId, session);
      await this.saveFiles(tx, projectId, session);
      await this.saveWorkingMemory(tx, session);
    });
  }

  private async saveMessages(tx: Prisma.TransactionClient, session: PersistedSession): Promise<void> {
    const messageIds = session.messages.map((message) => message.id);
    await tx.message.deleteMany({
      where: {
        sessionId: session.id,
        id: messageIds.length ? { notIn: messageIds } : undefined
      }
    });

    for (const message of session.messages) {
      await tx.message.upsert({
        where: { id: message.id },
        update: {
          role: message.role,
          content: message.content,
          status: message.status,
          sourceSessionId: message.sourceSessionId ?? null,
          createdAt: dateOrNow(message.createdAt),
          updatedAt: new Date()
        },
        create: {
          id: message.id,
          sessionId: session.id,
          role: message.role,
          content: message.content,
          status: message.status,
          sourceSessionId: message.sourceSessionId ?? null,
          createdAt: dateOrNow(message.createdAt),
          updatedAt: new Date()
        }
      });
    }
  }

  private async saveTasks(tx: Prisma.TransactionClient, projectId: string, session: PersistedSession): Promise<void> {
    const taskIds = session.tasks.map((task) => task.id);
    await tx.task.deleteMany({
      where: {
        sessionId: session.id,
        id: taskIds.length ? { notIn: taskIds } : undefined
      }
    });

    for (const task of session.tasks) {
      await tx.task.upsert({
        where: { id: task.id },
        update: {
          projectId,
          sessionId: session.id,
          title: task.title,
          status: task.status,
          x: task.x,
          y: task.y,
          linkedFileIdsJson: stringifyJson(task.linkedFileIds, "[]"),
          expanded: task.expanded,
          metadata: task.metadata,
          logJson: stringifyJson(task.log, "[]"),
          startedAt: nullableDate(task.startedAt),
          completedAt: nullableDate(task.completedAt),
          updatedAt: new Date()
        },
        create: {
          id: task.id,
          projectId,
          sessionId: session.id,
          title: task.title,
          status: task.status,
          x: task.x,
          y: task.y,
          linkedFileIdsJson: stringifyJson(task.linkedFileIds, "[]"),
          expanded: task.expanded,
          metadata: task.metadata,
          logJson: stringifyJson(task.log, "[]"),
          startedAt: nullableDate(task.startedAt),
          completedAt: nullableDate(task.completedAt),
          createdAt: dateOrNow(task.startedAt ?? session.createdAt),
          updatedAt: new Date()
        }
      });
    }
  }

  private async saveFiles(tx: Prisma.TransactionClient, projectId: string, session: PersistedSession): Promise<void> {
    const fileIds = session.files.map((file) => file.id);
    await tx.fileArtifact.deleteMany({
      where: {
        sessionId: session.id,
        id: fileIds.length ? { notIn: fileIds } : undefined
      }
    });

    for (const file of session.files) {
      await tx.fileArtifact.upsert({
        where: { id: file.id },
        update: {
          projectId,
          sessionId: session.id,
          taskId: taskIdForFile(session, file.id),
          name: file.name,
          path: file.path,
          relativePath: file.relativePath,
          kind: file.kind,
          previewKind: file.previewKind,
          previewJson: stringifyJson(file.preview, "[]"),
          language: file.language,
          mockContent: file.mockContent,
          x: file.x,
          y: file.y,
          isOpen: true,
          changeSummary: file.changeSummary ?? null,
          updatedAt: new Date()
        },
        create: {
          id: file.id,
          projectId,
          sessionId: session.id,
          taskId: taskIdForFile(session, file.id),
          name: file.name,
          path: file.path,
          relativePath: file.relativePath,
          kind: file.kind,
          previewKind: file.previewKind,
          previewJson: stringifyJson(file.preview, "[]"),
          language: file.language,
          mockContent: file.mockContent,
          x: file.x,
          y: file.y,
          isOpen: true,
          changeSummary: file.changeSummary ?? null,
          createdAt: dateOrNow(session.createdAt),
          updatedAt: new Date()
        }
      });
    }
  }

  private async saveWorkingMemory(tx: Prisma.TransactionClient, session: PersistedSession): Promise<void> {
    const recentMessages = session.messages.slice(-24).map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt
    }));

    await tx.sessionMemory.upsert({
      where: {
        sessionId_kind: {
          sessionId: session.id,
          kind: "working"
        }
      },
      update: {
        contextJson: stringifyJson({
          recentMessages,
          activeTaskId: session.activeTaskId,
          selectedFileId: session.selectedFileId
        }),
        summary: session.summary,
        strategy: "baseline",
        updatedAt: new Date()
      },
      create: {
        sessionId: session.id,
        kind: "working",
        contextJson: stringifyJson({
          recentMessages,
          activeTaskId: session.activeTaskId,
          selectedFileId: session.selectedFileId
        }),
        summary: session.summary,
        strategy: "baseline",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }
}
