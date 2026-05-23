import { z } from "zod";
export declare const taskSourceSchema: z.ZodEnum<{
    voice: "voice";
    text: "text";
    system: "system";
}>;
export declare const taskStatusSchema: z.ZodEnum<{
    pending: "pending";
    planning: "planning";
    ready: "ready";
    running: "running";
    checkpoint: "checkpoint";
    pause_requested: "pause_requested";
    paused: "paused";
    completed: "completed";
    failed: "failed";
}>;
export declare const createTaskInputSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    source: z.ZodDefault<z.ZodEnum<{
        voice: "voice";
        text: "text";
        system: "system";
    }>>;
    priority: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const taskItemSchema: z.ZodObject<{
    id: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    source: z.ZodEnum<{
        voice: "voice";
        text: "text";
        system: "system";
    }>;
    status: z.ZodEnum<{
        pending: "pending";
        planning: "planning";
        ready: "ready";
        running: "running";
        checkpoint: "checkpoint";
        pause_requested: "pause_requested";
        paused: "paused";
        completed: "completed";
        failed: "failed";
    }>;
    priority: z.ZodNumber;
    optimizedPromptId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
export type TaskSource = z.infer<typeof taskSourceSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type TaskItem = z.infer<typeof taskItemSchema>;
//# sourceMappingURL=task.d.ts.map