# Folder Structure

```text
v01/
  apps/
    api/
      src/
        routes/
        realtime/
        services/
      package.json
      tsconfig.json
    desktop/
      src/
        main/
        preload/
        renderer/
          components/
            ide/
          stores/
        shared/
      electron.vite.config.ts
      tailwind.config.ts
      package.json
      tsconfig.json
  packages/
    ai-orchestrator/
      src/
        execution/
        promptOptimizer/
        providers/
    code-intel/
      src/
    core/
      src/
        domain/
    database/
      src/
        schema/
    voice/
      src/
  docs/
    ARCHITECTURE.md
    FOLDER_STRUCTURE.md
    SAFE_EXECUTION.md
  data/
    .gitkeep
```

## Ownership

- `apps/desktop`: Native shell and UI only. It should not own autonomous execution.
- `apps/desktop/src/main`: Electron window, local filesystem IPC, and terminal command IPC.
- `apps/desktop/src/preload`: Narrow bridge exposed as `window.v01`.
- `apps/desktop/src/renderer`: React, Tailwind, Monaco, xterm, Zustand state, and IDE components.
- `apps/desktop/src/shared`: Types shared by main, preload, and renderer.
- `apps/api`: Local API, realtime state, task queue, pause/resume coordination, and future worker process control.
- `packages/core`: Shared domain types and validation schemas.
- `packages/database`: Drizzle schema and future database runtime.
- `packages/ai-orchestrator`: Provider-agnostic planning, prompt optimization, and execution planning.
- `packages/voice`: Continuous listening and transcription pipeline.
- `packages/code-intel`: Parser registry, AST tools, and git diff tracking.
