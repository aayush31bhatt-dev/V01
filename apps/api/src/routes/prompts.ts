import type { FastifyInstance } from "fastify";
import { createPromptSessionSchema } from "../schemas/promptExecution";
import { promptExecutionOrchestrator } from "../orchestrator/promptExecutionOrchestrator";

export async function promptRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async () => promptExecutionOrchestrator.listSessions());

  app.post("/", async (request, reply) => {
    const parsed = createPromptSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid prompt session input",
        issues: parsed.error.issues
      });
    }

    const session = await promptExecutionOrchestrator.createSession(parsed.data);
    return reply.code(201).send(session);
  });
}
