import { z } from "zod";
export declare const checkpointKindSchema: z.ZodEnum<{
    after_prompt: "after_prompt";
    after_file_changes: "after_file_changes";
    after_dependency_install: "after_dependency_install";
    after_build: "after_build";
    after_tests: "after_tests";
    manual_review: "manual_review";
}>;
export declare const checkpointSchema: z.ZodObject<{
    id: z.ZodString;
    runId: z.ZodString;
    kind: z.ZodEnum<{
        after_prompt: "after_prompt";
        after_file_changes: "after_file_changes";
        after_dependency_install: "after_dependency_install";
        after_build: "after_build";
        after_tests: "after_tests";
        manual_review: "manual_review";
    }>;
    label: z.ZodString;
    safeToPause: z.ZodBoolean;
    createdAt: z.ZodString;
}, z.core.$strip>;
export declare const pauseStateSchema: z.ZodObject<{
    requested: z.ZodBoolean;
    requestedAt: z.ZodNullable<z.ZodString>;
    nextCheckpoint: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const executionStateSchema: z.ZodObject<{
    activeRunId: z.ZodNullable<z.ZodString>;
    currentTaskId: z.ZodNullable<z.ZodString>;
    currentCheckpoint: z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        runId: z.ZodString;
        kind: z.ZodEnum<{
            after_prompt: "after_prompt";
            after_file_changes: "after_file_changes";
            after_dependency_install: "after_dependency_install";
            after_build: "after_build";
            after_tests: "after_tests";
            manual_review: "manual_review";
        }>;
        label: z.ZodString;
        safeToPause: z.ZodBoolean;
        createdAt: z.ZodString;
    }, z.core.$strip>>;
    pause: z.ZodObject<{
        requested: z.ZodBoolean;
        requestedAt: z.ZodNullable<z.ZodString>;
        nextCheckpoint: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CheckpointKind = z.infer<typeof checkpointKindSchema>;
export type ExecutionCheckpoint = z.infer<typeof checkpointSchema>;
export type PauseState = z.infer<typeof pauseStateSchema>;
export type ExecutionState = z.infer<typeof executionStateSchema>;
//# sourceMappingURL=execution.d.ts.map