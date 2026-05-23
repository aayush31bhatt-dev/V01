# Architecture

## Product Shape

v01 should feel like a calm desktop IDE for developers and an approachable workspace for beginners. The current foundation exposes familiar IDE primitives first: project files, editor tabs, Monaco editing, and an integrated terminal. AI surfaces are reserved in the right sidebar but are not active yet.

The long-term system is split into five layers:

1. **Experience layer:** Electron window, React UI, Tailwind layout, Monaco, xterm, and future AI side panels.
2. **Local API layer:** Fastify HTTP and WebSocket server for task state, history, execution control, and realtime updates.
3. **Orchestration layer:** Turns transcripts or typed prompts into tasks, optimized prompts, execution plans, and checkpointed work.
4. **Intelligence layer:** AI providers, prompt optimization, voice transcription, code parsing, and diff analysis.
5. **Persistence layer:** SQLite first, with schema boundaries designed for PostgreSQL later.

## Why This Boundary

The UI should never directly own autonomous execution. It should submit intent, render state, and let the local API coordinate the work. This keeps dangerous operations behind one boundary and makes it possible to add policy checks, sandboxing, and history capture before file mutation is allowed.

## Execution Model

The future autonomous engine should be checkpoint-driven:

- Plan task.
- Optimize prompt.
- Execute the next safe unit of work.
- Record prompt, files, dependencies, logs, and timestamps.
- Emit realtime progress.
- Check whether a pause was requested.
- Pause only at a safe checkpoint.

This avoids a hard stop button while still giving the user control.

## Data Model

The core product data is intentionally small:

- **Task:** User-visible unit of work.
- **Prompt:** Optimized instruction generated for a task.
- **Execution run:** One attempt to execute a task.
- **Checkpoint:** Safe pause boundary in an execution run.
- **History entry:** Immutable record of what happened.
- **File change reference:** Exact affected file sections shown when users inspect completed work.

## Provider Strategy

OpenAI, Anthropic, Whisper, and future custom models should be accessed through adapters. The orchestration layer should depend on capability interfaces such as text generation, transcription, prompt optimization, and tool execution, not on vendor SDKs directly.

## Security Posture

The current foundation does not execute code autonomously. Before adding execution, add:

- Workspace permission policy.
- Sandboxed command runner.
- Dependency install confirmation policy.
- Secrets redaction for logs and history.
- Git diff checkpoints before and after mutation.
- Per-task execution budget.
