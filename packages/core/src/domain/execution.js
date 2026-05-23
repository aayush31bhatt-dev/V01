import { z } from "zod";
export const checkpointKindSchema = z.enum([
    "after_prompt",
    "after_file_changes",
    "after_dependency_install",
    "after_build",
    "after_tests",
    "manual_review"
]);
export const checkpointSchema = z.object({
    id: z.string().min(1),
    runId: z.string().min(1),
    kind: checkpointKindSchema,
    label: z.string().min(1),
    safeToPause: z.boolean(),
    createdAt: z.string()
});
export const pauseStateSchema = z.object({
    requested: z.boolean(),
    requestedAt: z.string().nullable(),
    nextCheckpoint: z.string().nullable()
});
export const executionStateSchema = z.object({
    activeRunId: z.string().nullable(),
    currentTaskId: z.string().nullable(),
    currentCheckpoint: checkpointSchema.nullable(),
    pause: pauseStateSchema
});
