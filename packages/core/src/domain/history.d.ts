import { z } from "zod";
export declare const fileChangeReferenceSchema: z.ZodObject<{
    path: z.ZodString;
    changeKind: z.ZodEnum<{
        created: "created";
        updated: "updated";
        deleted: "deleted";
        renamed: "renamed";
    }>;
    startLine: z.ZodOptional<z.ZodNumber>;
    endLine: z.ZodOptional<z.ZodNumber>;
    diffHunkId: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const dependencyInstallSchema: z.ZodObject<{
    manager: z.ZodEnum<{
        pnpm: "pnpm";
        npm: "npm";
        yarn: "yarn";
        bun: "bun";
        pip: "pip";
        cargo: "cargo";
        other: "other";
    }>;
    name: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const historyEntrySchema: z.ZodObject<{
    id: z.ZodString;
    taskId: z.ZodString;
    runId: z.ZodString;
    promptId: z.ZodOptional<z.ZodString>;
    prompt: z.ZodOptional<z.ZodString>;
    filesModified: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        changeKind: z.ZodEnum<{
            created: "created";
            updated: "updated";
            deleted: "deleted";
            renamed: "renamed";
        }>;
        startLine: z.ZodOptional<z.ZodNumber>;
        endLine: z.ZodOptional<z.ZodNumber>;
        diffHunkId: z.ZodOptional<z.ZodString>;
        summary: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    dependenciesInstalled: z.ZodArray<z.ZodObject<{
        manager: z.ZodEnum<{
            pnpm: "pnpm";
            npm: "npm";
            yarn: "yarn";
            bun: "bun";
            pip: "pip";
            cargo: "cargo";
            other: "other";
        }>;
        name: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    logs: z.ZodArray<z.ZodString>;
    startedAt: z.ZodString;
    completedAt: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export type FileChangeReference = z.infer<typeof fileChangeReferenceSchema>;
export type DependencyInstall = z.infer<typeof dependencyInstallSchema>;
export type HistoryEntry = z.infer<typeof historyEntrySchema>;
//# sourceMappingURL=history.d.ts.map