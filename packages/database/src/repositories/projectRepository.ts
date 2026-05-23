import { createHash } from "node:crypto";
import type { PrismaClient } from "../generated/prisma/client";
import { stringifyJson } from "./json";
import type { PersistedProject } from "./types";

const defaultProjectId = "project-local-default";

function stableProjectId(rootPath: string | null | undefined): string {
  if (!rootPath) {
    return defaultProjectId;
  }

  const hash = createHash("sha256").update(rootPath.toLowerCase()).digest("hex").slice(0, 20);
  return `project-${hash}`;
}

export class ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getOrCreateProject(input: {
    rootPath?: string | null;
    name?: string | null;
    metadata?: Record<string, unknown>;
  } = {}): Promise<PersistedProject> {
    const rootPath = input.rootPath ?? null;
    const id = stableProjectId(rootPath);
    const name = input.name?.trim() || (rootPath ? rootPath.split(/[\\/]/).filter(Boolean).at(-1) ?? "Untitled project" : "Local workspace");
    const now = new Date();

    const project = await this.prisma.project.upsert({
      where: { id },
      update: {
        name,
        rootPath,
        metadataJson: stringifyJson(input.metadata ?? {}),
        updatedAt: now,
        lastOpenedAt: now
      },
      create: {
        id,
        name,
        rootPath,
        metadataJson: stringifyJson(input.metadata ?? {}),
        createdAt: now,
        updatedAt: now,
        lastOpenedAt: now
      }
    });

    return {
      id: project.id,
      name: project.name,
      rootPath: project.rootPath,
      metadata: input.metadata ?? {}
    };
  }

  async getLatestProject(): Promise<PersistedProject> {
    const project = await this.prisma.project.findFirst({
      orderBy: [{ lastOpenedAt: "desc" }, { updatedAt: "desc" }]
    });

    if (!project) {
      return this.getOrCreateProject();
    }

    await this.prisma.project.update({
      where: { id: project.id },
      data: {
        lastOpenedAt: new Date()
      }
    });

    return {
      id: project.id,
      name: project.name,
      rootPath: project.rootPath,
      metadata: {}
    };
  }
}
