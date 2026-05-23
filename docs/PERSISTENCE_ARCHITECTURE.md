# Persistence Architecture

v01 uses a local-first persistence stack with three clear layers:

1. **Renderer UI cache**
   - Zustand stores reactive state needed to render and interact with the IDE.
   - It is hydrated from the backend on startup and debounced back to the backend after changes.
   - It is not the durable database.

2. **Local persistent database**
   - SQLite is the local source of truth.
   - Prisma owns typed data access through `@v01/database`.
   - The API is the only layer that writes database state.

3. **Future cloud boundary**
   - Repositories hide Prisma and database-specific details from API routes and orchestration.
   - Models avoid SQLite-only concepts so a PostgreSQL-backed cloud service can reuse the same service/repository contracts later.
   - Sync is intentionally not implemented yet.

## Durable Data

The Prisma schema persists:

- users and projects
- independent AI sessions and messages
- session memory
- tasks
- file artifacts
- AI responses
- execution events
- workspace viewport/layout state
- preferences and theme settings
- open editor tabs

Each AI session owns its own messages, memory, tasks, artifacts, and execution events. The backend accepts the renderer's `clientSessionId`, so a floating card has one stable identity across UI, API execution, and SQLite.

## Runtime Behavior

On API startup, `@v01/database` initializes the SQLite database, applies the local schema if needed, and recovers from obvious SQLite corruption by moving the bad file aside before creating a clean database.

On renderer startup, `hydrateWorkspace()` loads the latest workspace snapshot from `/workspace-state`, restores sessions, open tabs, theme preferences, active session, and the canvas viewport. Subsequent changes are saved through a debounced `PUT /workspace-state`.

Prompt execution persists structured history through repositories:

- accepted prompt events
- AI plan/response records
- task lifecycle events
- file change events
- completion, pause, and error events

Prompt optimization hooks live at `apps/api/src/prompt-optimization/promptOptimizationPipeline.ts`. They are currently baseline pass-through hooks reserved for future token optimization, context compression, memory selection, and prompt rewriting.
