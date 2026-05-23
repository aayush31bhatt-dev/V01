import type { PrismaClient } from "../generated/prisma/client";
import { parseJson, stringifyJson } from "./json";
import { ProjectRepository } from "./projectRepository";
import { SessionRepository } from "./sessionRepository";
import type {
  PersistedFloatingFile,
  PersistedOpenTab,
  PersistedPanelLayout,
  PersistedPreferences,
  PersistedWorkspaceView,
  WorkspaceSnapshot
} from "./types";

const defaultPreferences: PersistedPreferences = {
  themeProfileId: "studio-graphite",
  customThemeColors: {}
};

const defaultWorkspace: PersistedWorkspaceView = {
  viewportX: -180,
  viewportY: -80,
  viewportZoom: 1,
  activeSessionId: null,
  activeFilePath: null,
  leftTab: "explorer",
  terminalOpen: true,
  layout: {}
};

function mapOpenTab(tab: {
  path: string;
  name: string;
  language: string;
  contentSnapshot: string | null;
  originalContent: string | null;
  dirty: boolean;
  mtimeMs: number | null;
}): PersistedOpenTab {
  const content = tab.contentSnapshot ?? "";
  return {
    path: tab.path,
    name: tab.name,
    language: tab.language,
    content,
    originalContent: tab.originalContent ?? content,
    dirty: tab.dirty,
    mtimeMs: tab.mtimeMs ?? Date.now(),
    size: content.length
  };
}

export class WorkspaceRepository {
  private readonly projects: ProjectRepository;
  private readonly sessions: SessionRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.projects = new ProjectRepository(prisma);
    this.sessions = new SessionRepository(prisma);
  }

  async loadLatestSnapshot(): Promise<WorkspaceSnapshot> {
    const project = await this.projects.getLatestProject();
    const workspaceState = await this.prisma.workspaceState.findUnique({
      where: { projectId: project.id }
    });
    const preferences = await this.loadPreferences(project.id);
    const openTabs = await this.prisma.openTab.findMany({
      where: { projectId: project.id },
      orderBy: [{ order: "asc" }, { updatedAt: "asc" }]
    });

    const layout = workspaceState
      ? parseJson<Record<string, unknown>>(workspaceState.layoutJson, {})
      : {};

    return {
      project,
      workspace: workspaceState
        ? {
            viewportX: workspaceState.viewportX,
            viewportY: workspaceState.viewportY,
            viewportZoom: workspaceState.viewportZoom,
            activeSessionId: workspaceState.activeSessionId,
            activeFilePath: workspaceState.activeFilePath,
            leftTab: workspaceState.leftTab,
            terminalOpen: workspaceState.terminalOpen,
            layout
          }
        : defaultWorkspace,
      preferences,
      sessions: await this.sessions.listByProject(project.id),
      openTabs: openTabs.map(mapOpenTab),
      panels: (layout.panels as PersistedPanelLayout | undefined) ?? undefined,
      floatingFiles: (layout.floatingFiles as PersistedFloatingFile[] | undefined) ?? undefined
    };
  }

  async saveSnapshot(snapshot: WorkspaceSnapshot): Promise<WorkspaceSnapshot> {
    const project = await this.projects.getOrCreateProject({
      rootPath: snapshot.project.rootPath,
      name: snapshot.project.name,
      metadata: snapshot.project.metadata
    });
    const now = new Date();

    const layoutJson = stringifyJson({
      ...(snapshot.workspace.layout ?? {}),
      panels: snapshot.panels ?? undefined,
      floatingFiles: snapshot.floatingFiles ?? undefined
    });

    await this.prisma.workspaceState.upsert({
      where: { projectId: project.id },
      update: {
        viewportX: snapshot.workspace.viewportX,
        viewportY: snapshot.workspace.viewportY,
        viewportZoom: snapshot.workspace.viewportZoom,
        activeSessionId: snapshot.workspace.activeSessionId,
        activeFilePath: snapshot.workspace.activeFilePath,
        leftTab: snapshot.workspace.leftTab,
        terminalOpen: snapshot.workspace.terminalOpen,
        layoutJson,
        updatedAt: now
      },
      create: {
        projectId: project.id,
        viewportX: snapshot.workspace.viewportX,
        viewportY: snapshot.workspace.viewportY,
        viewportZoom: snapshot.workspace.viewportZoom,
        activeSessionId: snapshot.workspace.activeSessionId,
        activeFilePath: snapshot.workspace.activeFilePath,
        leftTab: snapshot.workspace.leftTab,
        terminalOpen: snapshot.workspace.terminalOpen,
        layoutJson,
        createdAt: now,
        updatedAt: now
      }
    });

    await this.savePreferences(project.id, snapshot.preferences);
    await this.saveOpenTabs(project.id, snapshot.openTabs);

    // Delete sessions that no longer exist in the snapshot
    const currentSessionIds = snapshot.sessions.map((s) => s.id);
    if (currentSessionIds.length > 0) {
      await this.prisma.session.deleteMany({
        where: {
          projectId: project.id,
          id: { notIn: currentSessionIds }
        }
      });
    } else {
      await this.prisma.session.deleteMany({
        where: { projectId: project.id }
      });
    }

    for (const session of snapshot.sessions) {
      await this.sessions.save(project.id, session);
    }

    return {
      ...snapshot,
      project
    };
  }

  private async loadPreferences(projectId: string): Promise<PersistedPreferences> {
    const rows = await this.prisma.preference.findMany({
      where: { projectId }
    });
    const byKey = new Map(rows.map((row) => [row.key, row.valueJson]));

    return {
      themeProfileId: parseJson<string>(byKey.get("themeProfileId"), defaultPreferences.themeProfileId),
      customThemeColors: parseJson<Record<string, string>>(byKey.get("customThemeColors"), {}),
      canvasBg: parseJson<string | undefined>(byKey.get("canvasBg"), undefined),
      selectedModel: parseJson<string | undefined>(byKey.get("selectedModel"), undefined)
    };
  }

  private async savePreferences(projectId: string, preferences: PersistedPreferences): Promise<void> {
    const entries: Array<[string, unknown]> = [
      ["themeProfileId", preferences.themeProfileId],
      ["customThemeColors", preferences.customThemeColors]
    ];

    if (preferences.canvasBg) entries.push(["canvasBg", preferences.canvasBg]);
    if (preferences.selectedModel) entries.push(["selectedModel", preferences.selectedModel]);

    for (const [key, value] of entries) {
      await this.prisma.preference.upsert({
        where: {
          projectId_key: {
            projectId,
            key
          }
        },
        update: {
          valueJson: stringifyJson(value),
          updatedAt: new Date()
        },
        create: {
          projectId,
          key,
          valueJson: stringifyJson(value),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }

  private async saveOpenTabs(projectId: string, openTabs: PersistedOpenTab[]): Promise<void> {
    const paths = openTabs.map((tab) => tab.path);
    await this.prisma.openTab.deleteMany({
      where: {
        projectId,
        path: paths.length ? { notIn: paths } : undefined
      }
    });

    for (const [index, tab] of openTabs.entries()) {
      await this.prisma.openTab.upsert({
        where: {
          projectId_path: {
            projectId,
            path: tab.path
          }
        },
        update: {
          name: tab.name,
          language: tab.language,
          order: index,
          active: false,
          dirty: tab.dirty,
          isVirtual: tab.path.startsWith("v01://"),
          contentSnapshot: tab.content,
          originalContent: tab.originalContent,
          mtimeMs: tab.mtimeMs,
          updatedAt: new Date()
        },
        create: {
          projectId,
          path: tab.path,
          name: tab.name,
          language: tab.language,
          order: index,
          active: false,
          dirty: tab.dirty,
          isVirtual: tab.path.startsWith("v01://"),
          contentSnapshot: tab.content,
          originalContent: tab.originalContent,
          mtimeMs: tab.mtimeMs,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
  }
}
