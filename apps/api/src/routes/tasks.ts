import type { FastifyInstance } from "fastify";
import { createTaskInputSchema } from "@v01/core";
import { realtimeHub } from "../realtime/realtimeHub";
import { taskQueue } from "../services/taskQueue";

export async function taskRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async () => taskQueue.list());

  app.post("/", async (request, reply) => {
    const parsed = createTaskInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid task input",
        issues: parsed.error.issues
      });
    }

    const task = taskQueue.create(parsed.data);
    realtimeHub.publish({
      type: "task.created",
      taskId: task.id,
      at: task.createdAt
    });

    return reply.code(201).send(task);
  });
}

