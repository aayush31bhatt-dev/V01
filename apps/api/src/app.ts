import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { executionRoutes } from "./routes/execution";
import { historyRoutes } from "./routes/history";
import { promptRoutes } from "./routes/prompts";
import { taskRoutes } from "./routes/tasks";
import { workspaceStateRoutes } from "./routes/workspaceState";
import { realtimeHub } from "./realtime/realtimeHub";
import { localPersistence } from "./persistence/localPersistence";
import { promptExecutionOrchestrator } from "./orchestrator/promptExecutionOrchestrator";

export async function buildApp() {
  await localPersistence();
  await promptExecutionOrchestrator.initialize();

  const app = Fastify({
    logger: true
  });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  });
  await app.register(websocket);

  app.get("/health", async () => ({
    ok: true,
    service: "v01-api"
  }));

  app.get("/realtime", { websocket: true }, (socket) => {
    realtimeHub.attach(socket);
  });

  await app.register(taskRoutes, { prefix: "/tasks" });
  await app.register(promptRoutes, { prefix: "/prompts" });
  await app.register(historyRoutes, { prefix: "/history" });
  await app.register(executionRoutes, { prefix: "/execution" });
  await app.register(workspaceStateRoutes, { prefix: "/workspace-state" });

  return app;
}
