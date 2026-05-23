import type { PrismaClient } from "./generated/prisma/client";
import { initializeLocalDatabase, type DatabaseLogger, type LocalDatabaseOptions } from "./client";
import { ExecutionRepository } from "./repositories/executionRepository";
import { ProjectRepository } from "./repositories/projectRepository";
import { SessionRepository } from "./repositories/sessionRepository";
import { WorkspaceRepository } from "./repositories/workspaceRepository";

export interface LocalPersistence {
  prisma: PrismaClient;
  projects: ProjectRepository;
  sessions: SessionRepository;
  workspace: WorkspaceRepository;
  execution: ExecutionRepository;
  disconnect: () => Promise<void>;
}

export async function createLocalPersistence(options: LocalDatabaseOptions = {}): Promise<LocalPersistence> {
  const initialized = await initializeLocalDatabase(options);
  const prisma = initialized.prisma;

  return {
    prisma,
    projects: new ProjectRepository(prisma),
    sessions: new SessionRepository(prisma),
    workspace: new WorkspaceRepository(prisma),
    execution: new ExecutionRepository(prisma),
    disconnect: () => prisma.$disconnect()
  };
}

export type { DatabaseLogger, LocalDatabaseOptions };
