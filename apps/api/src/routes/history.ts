import type { FastifyInstance } from "fastify";
import { promptExecutionOrchestrator } from "../orchestrator/promptExecutionOrchestrator";

export async function historyRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async () => promptExecutionOrchestrator.listHistory());
}
