# v01

v01 is an AI-first autonomous IDE foundation. The product goal is to let users describe what they want in speech or text while the system plans, executes, records, and explains work without exposing raw code by default.

This repository intentionally contains only the startup-grade base architecture. It does not include full agents, autonomous file mutation, custom models, authentication, cloud deployment, or marketplace features.

## Architecture Decisions

- **Desktop shell:** Electron, because the IDE needs local filesystem access, terminal integration, native windows, and a path to sandboxed execution later.
- **Frontend:** React, TypeScript, and Vite through `electron-vite`, keeping the renderer fast and easy to split into product surfaces.
- **Backend API:** Local Fastify service scaffold for later orchestration. The current desktop IDE UI does not depend on AI backend features.
- **Data layer:** SQLite for the MVP with Drizzle schema definitions. Tables are shaped so the storage layer can move to PostgreSQL without rewriting the domain model.
- **AI layer:** Provider adapters behind an orchestration interface. OpenAI, Anthropic, and future custom prompt models should plug in without leaking provider details into the UI.
- **Voice layer:** A pipeline package owns speech chunks, transcript segments, and future Whisper API integration.
- **Code intelligence:** Separate package for tree-sitter, ts-morph, and git diff tracking so code analysis can grow independently.
- **Pause model:** Cooperative pause requests only. Execution should pause after safe checkpoints such as file writes, dependency installs, builds, and tests.
- **IDE-first shell:** The current renderer prioritizes file navigation, Monaco editing, file tabs, and an integrated terminal. The right rail is reserved for future AI surfaces.

## Commands

Install dependencies:

```bash
npm install
```

Run the desktop IDE:

```bash
npm run dev
```

On Windows PowerShell, if `npm.ps1` is blocked by execution policy, use `npm.cmd install` and `npm.cmd run dev` from the same folder.

Run one side at a time:

```bash
npm run dev:api
npm run dev:desktop
```

## Current Scope

Built now:

- Monorepo structure
- Electron base setup
- React, TypeScript, and Tailwind renderer foundation
- Zustand workspace state
- Framer Motion UI transitions
- Local Fastify API foundation
- Monaco editor with file tabs and save support
- xterm.js terminal panel with command execution
- Local folder picker and file tree
- File search
- AI orchestration folder structure
- Voice pipeline placeholder
- Execution history schema
- Task management schema
- Safe pause/resume placeholders
- Minimal IDE layout with left sidebar, editor workspace, right future-AI rail, and bottom terminal

Not built now:

- Full AI agents
- Autonomous coding workflows
- Voice input
- Custom prompt optimization model
- Marketplace or enterprise systems
- Cloud deployment
- Advanced auth
