import type { FastifyInstance } from "fastify";
import { localPersistence } from "../persistence/localPersistence";
import { workspaceSnapshotSchema } from "../schemas/workspaceState";

export async function workspaceStateRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async () => (await localPersistence()).workspace.loadLatestSnapshot());

  app.put("/", async (request, reply) => {
    const parsed = workspaceSnapshotSchema.safeParse(request.body);
    if (!parsed.success) {
      console.error("Workspace state validation failed:", JSON.stringify(parsed.error.issues, null, 2));
      return reply.code(400).send({
        error: "Invalid workspace snapshot",
        issues: parsed.error.issues
      });
    }

    const snapshot = await (await localPersistence()).workspace.saveSnapshot({
      ...parsed.data,
      project: {
        ...parsed.data.project,
        id: parsed.data.project.id ?? ""
      },
      preferences: {
        themeProfileId: parsed.data.preferences.themeProfileId,
        customThemeColors: parsed.data.preferences.customThemeColors,
        canvasBg: parsed.data.preferences.canvasBg,
        selectedModel: parsed.data.preferences.selectedModel
      },
      panels: parsed.data.panels ?? undefined,
      floatingFiles: parsed.data.floatingFiles ?? undefined
    });
    return reply.send(snapshot);
  });
}
