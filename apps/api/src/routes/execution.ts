import type { FastifyInstance } from "fastify";
import { executionCoordinator } from "../services/executionCoordinator";

export async function executionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/state", async () => executionCoordinator.getState());

  app.post("/pause", async () => executionCoordinator.requestPause());

  app.post("/resume", async () => executionCoordinator.resume());
}

