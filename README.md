# V01 IDE — Autonomous AI-First Developer Workspace

V01 is a state-of-the-art, **AI-first autonomous developer workspace** designed to let you build complete applications using natural language, voice decisions, and an interactive spatial canvas. Unlike traditional linear chat interfaces, V01 organizes prompts, workspace reasoning, and file modifications as connected execution nodes, allowing the AI to autonomously plan, execute terminal commands, verify code changes, manage files, and explain its operations in real-time.

---

## 📐 IDE Layout & Visual Hierarchy

The V01 desktop client structure is optimized for visual context, placing your active prompt canvas and terminal workspace at the center of attention:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                  V01 IDE                                   │
├──────────────┬──────────────────────────────────────────────┬──────────────┤
│  Sidebar     │     Infinite Workspace & AI Chat Region      │ Code Editor  │
│  (Left)      │                  (Middle)                    │  (Right)     │
│              │                                              │              │
│ ┌──────────┐ │  ┌──────────────┐   ┌───────────────────┐    │ ┌──────────┐ │
│ │ Files    │ │  │ Minimap Card │   │ Session Detail    │    │ │ Tabs     │ │
│ ├──────────┤ │  └──────────────┘   └───────────────────┘    │ ├──────────┤ │
│ │ Search   │ │                                              │ │          │ │
│ ├──────────┤ │        ┌───────────────────────────────┐     │ │ Monaco   │ │
│ │ Git      │ │        │ Active AI Session (Node Card) │     │ │ Code     │ │
│ └──────────┘ │        └───────────────────────────────┘     │ │ Editor / │ │
│              │                                              │ │ Diff     │ │
│              │   ┌────────────────────────────────────────┐ │ │ Panel    │ │
│              │   │  Attachment   Continue Session... [AI] │ │ │          │ │
│              │   └────────────────────────────────────────┘ │ └──────────┘ │
│              ├──────────────────────────────────────────────┤              │
│              │        Multi-session Terminal (xterm.js)     │              │
└──────────────┴──────────────────────────────────────────────┴──────────────┘
```

1. **Left Sidebar:** A consolidated resource explorer containing:
   * **Files Tab:** Standard project workspace tree explorer (with options to create files and directories).
   * **Search Tab:** Global full-text codebase search with file path filtering and regex support.
   * **Git Tab:** Visual git interface showing staged, unstaged, and untracked file statuses, file diff view triggers, staging/unstaging controls, commit inputs, and stash pop/save shortcuts.
2. **Middle Column (Infinite Workspace & Terminal):**
   * **Prompt Cluster Canvas:** A node-based, zoomable workspace where prompt sessions, file contexts, and AI executions are laid out visually. Includes a floating chat bar at the bottom with attachment handlers and model selection pills.
   * **Session Detail Panel:** Opens when selecting a node card to review chronological prompt logs, reasoning steps, and timeline actions.
   * **Terminal Panel:** Integrated xterm.js terminal providing live execution output from active background tasks and manual commands.
3. **Right Column (Code Editor):**
   * **Monaco Editor Window:** Custom wrapper for Microsoft's Monaco engine featuring dirty-state indicators, multi-tab layout, and file-saving keybinds.
   * **Prompt Diff Panel:** Renders inline diff lines (additions, deletions, and context blocks) showing file impact reports directly from AI modifications.

---

## 🌟 Core Features

### 🔑 Slide Onboarding & Aesthetic Customization
* **Slide-Tour wizard:** An animated Framer Motion onboarding wizard that introduces new users to Context Regions, Plan Mode, and Meeting Mode.
* **NVIDIA API Sync:** Validates and saves the user's `nvapi-` key into local browser storage, syncing with the local sqlite backend.
* **Live Theme Switcher:** Four curated visual palettes with canvas style backgrounds that update the workspace styling instantly:
  * **Studio Graphite:** Slate-green charcoal dark mode.
  * **Soft Carbon:** Cool indigo-carbon dark mode.
  * **Monolith Slate:** Neutral slate-gray dark mode.
  * **Paper Ink:** Warm, low-contrast cream light mode.

### 📐 Visual Prompt Canvas & Context Regions
* **Spatial Playground:** Drag, arrange, and group prompt session cards across an infinite grid.
* **Context Boundary Box:** Draw custom region bounding boxes around project folders and files on the canvas. The local API server scans all files inside the bounds to feed relevant structural context to the LLM, staying within Token-Per-Minute (TPM) limits.

### 🧭 Autonomous Execution Modes
* **Plan Mode:** Designed for complex multi-file refactoring. The AI director creates an interactive, step-by-step checklist of shell commands and code modifications. The user reviews, edits, and explicitly approves each action before execution.
* **Meeting Mode (Voice decisions):** Captures microphone audio, streams it to the backend, and uses transcription pipelines to automatically turn spoken decisions into actionable canvas nodes.

### 🔍 Monaco Selection Snippet Referencing
* **Floating Selection Pill:** Selecting any block of code within Monaco floating windows activates a **"Reference L[X]-L[Y] in Chat"** pill overlay positioned dynamically at the bottom-center of the window.
* **Intelligent Attachment Handoff:** Clicking this pill automatically locates the nearest prompt session card on the spatial canvas and appends the selected code excerpt as an attachment block, simplifying contextual chat references.
* *Implemented in:* [FloatingFileWindow.tsx](file:///a:/Aayush,s%20Stuff/v01/apps/desktop/src/renderer/components/ide/FloatingFileWindow.tsx)

### ✅ Automated Multi-Language Verification System
To ensure generated code remains syntax-correct and buildable, V01 triggers an automated verification pipeline on file modifications:
* **Multi-Language Coverage:**
  1. **package.json scripts:** Prioritizes project-specific scripts (`typecheck` > `test` > `build` > `lint`).
  2. **Python:** Compiles files via `python -m py_compile <file>`.
  3. **Rust:** Validates compilation logic using `cargo check`.
  4. **Go:** Checks project packages with `go build ./...`.
  5. **TypeScript:** Scans files without emitting output using `npx tsc --noEmit`.
  6. **JavaScript:** Runs syntactic integrity parsing via `node --check <file>`.
  7. **JSON/YAML:** Asserts structured config validity via `JSON.parse` and `js-yaml` parsers.
* **AI Feedback loop:** If verification fails, a `verificationFailed` flag is flagged, displaying a `⚠️ Verification failed` warning in the workspace timeline. The terminal error output is injected back into the LLM context, allowing the AI to autonomously self-correct and debug syntax errors.
* *Implemented in:* [promptExecutionOrchestrator.ts](file:///a:/Aayush,s%20Stuff/v01/apps/api/src/orchestrator/promptExecutionOrchestrator.ts) and [commandClassifier.ts](file:///a:/Aayush,s%20Stuff/v01/apps/api/src/terminal/commandClassifier.ts)

### 📁 Directory-Based Layout & State Persistence
* **Contextual Layout Caching:** Workspace state configurations (active tabs, window pane widths, viewport zoom, and canvas coordinates) are saved and re-applied dynamically on a per-directory basis as the user switches between folders.
* **Minimap Preference Persistence:** Saves Monaco Editor minimap visibility settings dynamically across directory roots.
* *Implemented in:* [workspaceState.ts](file:///a:/Aayush,s%20Stuff/v01/apps/api/src/routes/workspaceState.ts) and [workspaceStore.ts](file:///a:/Aayush,s%20Stuff/v01/apps/desktop/src/renderer/stores/workspaceStore.ts)

### 💻 Developer Git Integration & Folder Isolation
* **Directory-Scoped Git:** The integrated Git panel filters file lists and tracks branch structures scoped specifically to the selected project directory root, allowing clean multi-repository workflows inside the same parent environment.
* **Staging & Commit Control:** Stage or unstage individual files and push/pull commits directly to upstream remotes.
* **Stash Management:** Save work in progress to the stash and pop it back seamlessly.
* *Implemented in:* [gitStore.ts](file:///a:/Aayush,s%20Stuff/v01/apps/desktop/src/renderer/stores/gitStore.ts)

---

## 📱 V01 Companion Mobile App

The V01 Companion is a native Android mobile application built with Jetpack Compose and Kotlin that extends the IDE workspace directly to your pocket.

### 📐 Mobile Screens & Visual Hierarchy

To coordinate remote development tasks, the mobile app UI is structured to replicate your desktop workspace context on the go:

#### 🗺️ Workspace Atlas Screen Layout
```
┌────────────────────────────────────────┐
│ [=] v01 ATLAS                     [OK] │
├────────────────────────────────────────┤
│  [+] [-] [o]                           │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Context Region: Authentication   │  │
│  │                                  │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │ Auth Master Card           │  │  │
│  │  └────────────────────────────┘  │  │
│  │               │                  │  │
│  │               v                  │  │
│  │  ┌────────────────────────────┐  │  │
│  │  │ Session: Setup Auth Routes  │  │  │
│  │  └────────────────────────────┘  │  │
│  └──────────────────────────────────┘  │
│                                        │
├────────────────────────────────────────┤
│   [Home]  [Atlas]  [Voice]  [Settings] │
└────────────────────────────────────────┘
```

#### 🎙️ Meeting Mode Screen Layout
```
┌────────────────────────────────────────┐
│ [=] VOICE CAPTURE                 [OK] │
├────────────────────────────────────────┤
│                                        │
│             Recording...               │
│                                        │
│             ((  O  ))                  │
│            ( (  O  ) )                 │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │ Decided:                         │  │
│  │ Implement JWT authorization      │  │
│  │ middleware inside                │  │
│  │ apps/api/src/routes/auth.ts      │  │
│  └──────────────────────────────────┘  │
│                                        │
│          [ Push to Canvas ]            │
│                                        │
├────────────────────────────────────────┤
│   [Home]  [Atlas]  [Voice]  [Settings] │
└────────────────────────────────────────┘
```

---

### 🗺️ Workspace Atlas Screen
* **Infinite Mobile Canvas:** Mirroring the desktop layout, the Mobile Atlas renders your project workspace as a zoomable, panning infinite map.
* **Context Region & Node Rendering:** View active prompt cards, Context region overlays, Mastercard nodes, and layout hierarchies in real-time.
* **Visual Reference:** Check out the mobile canvas implementation and screen layout under [Website/assets/workspace-atlas.png](file:///a:/Aayush,s%20Stuff/v01/Website/assets/workspace-atlas.png)
* *Core Implementation:* [WorkspaceAtlasScreen.kt](file:///a:/Aayush,s%20Stuff/v01/Mobile%20app/app/src/main/java/com/v01/companion/ui/screens/atlas/WorkspaceAtlasScreen.kt)

### 🎙️ Meeting Mode Screen
* **Live standup Transcription:** Record standup discussions or meeting audio directly from your phone.
* **Decisions to Prompts:** The backend transcribes the audio, extracts actionable engineering decisions, and streams them as ready-to-execute prompt cards directly onto the desktop spatial canvas.
* **Visual Reference:** Review the mobile meeting capture layout at [Website/assets/meeting%20mode.jpeg](file:///a:/Aayush,s%20Stuff/v01/Website/assets/meeting%20mode.jpeg)
* *Core Implementation:* [MeetingModeScreen.kt](file:///a:/Aayush,s%20Stuff/v01/Mobile%20app/app/src/main/java/com/v01/companion/ui/screens/meeting/MeetingModeScreen.kt)

### 🔔 Activity Feed & Live Monitoring (Remote Command Approval Loop)
* **Real-time Event Streaming:** Monitor active task runs, model responses, and execution steps remotely.
* **Push Actions & Command Approvals:** Scrutinize AI-requested terminal shell executions and tap to approve or reject them directly from your mobile device.

```mermaid
sequenceDiagram
    participant AI as API Orchestrator (Fastify)
    participant Desktop as Electron Desktop IDE
    participant Mobile as Mobile Companion App (Kotlin)
    
    AI->>Desktop: Requires terminal command execution approval
    AI->>Mobile: Broadcasts command details via WebSocket
    Note over Mobile: User gets notification:<br/>"Confirm: npm run build"
    Mobile->>AI: User taps Approve/Reject
    AI->>Desktop: Execution proceeding (or aborted)
```
- **Visual Screenshots:** Review the full notification interface and details in [Screenshot 1](file:///a:/Aayush,s%20Stuff/v01/Website/assets/Screenshot_20260701_121959.jpg.jpeg) | [Screenshot 2](file:///a:/Aayush,s%20Stuff/v01/Website/assets/Screenshot_20260701_122133.jpg.jpeg) | [Screenshot 3](file:///a:/Aayush,s%20Stuff/v01/Website/assets/Screenshot_20260701_122154.jpg.jpeg)

---

## 🌐 Static Landing Website

V01 includes a premium static marketing website located in the [Website/](file:///a:/Aayush,s%20Stuff/v01/Website) directory:
* **Workflow Step Slider:** An interactive, scroll-triggered workflow track demonstrating the *Plan ➔ Organize ➔ Execute ➔ Review ➔ Iterate* loop utilizing GSAP and ScrollTrigger.
* **Visual Device Overlays:** Showcases high-fidelity overlapping mockups of the desktop canvas editor and mobile app screens.
* **Responsive Layouts:** Full support for mobile layouts, complete with slide-out navigation bars and optimized download triggers.
* *Source Entry:* [index.html](file:///a:/Aayush,s%20Stuff/v01/Website/index.html)

---

## 📂 Repository Directory Structure

This monorepo is structured using pnpm workspaces:

```
v01/
├── apps/
│   ├── desktop/                 # Electron Application
│   │   ├── src/
│   │   │   ├── main/            # Electron main process (Single Instance, Date Lock, Git & Term IPCs)
│   │   │   ├── preload/         # IPC bridge bindings for renderer security
│   │   │   └── renderer/        # React 19 Frontend (Zustand stores, Monaco editor, Canvas components)
│   │   ├── build/               # App bundle icons (icon.ico, icon.png)
│   │   ├── electron-builder.json# Production installer compilation configs
│   │   └── package.json
│   └── api/                     # Local Fastify API Server
│       ├── src/
│       │   ├── routes/          # Fastify routing controllers (tasks, search, history, companion)
│       │   ├── orchestrator/    # Agent execution pipeline, environment probe, and plan director
│       │   ├── persistence/     # Local database connection bootstrap
│       │   ├── providers/       # LLM integrations (NVIDIA NIM, OpenAI, Anthropic, Gemini, AWS Bedrock)
│       │   └── app.ts           # Fastify server bootstrap & websocket attachment
│       └── package.json
├── packages/
│   ├── database/                # Database layer (SQLite + Prisma client generation)
│   │   ├── prisma/              # Schema definition (schema.prisma) & migration history
│   │   └── src/                 # Client initialization and helper wrappers
│   ├── ai-orchestrator/         # Prompt formatting & provider adapters
│   ├── code-intel/              # Tree-sitter AST parsing and structural diff tracking
│   ├── core/                    # Shared Types and event structures
│   └── voice/                   # Audio recording hooks and voice transcription hooks
├── Mobile app/                  # Android Companion Application (Jetpack Compose / Kotlin)
│   └── app/src/main/java/com/v01/companion/
│       ├── data/                # API communication (Retrofit) & user preferences
│       ├── notification/        # Background notification handlers for remote terminal approvals
│       └── ui/
│           ├── screens/         # Home, Workspace Atlas, Meeting Mode, and Settings views
│           └── theme/           # Color profiles and typography rules
├── Website/                     # Static Landing Showcase Page (HTML/Vanilla CSS/GSAP)
│   ├── assets/                  # Graphical mockups, screenshots, logos, and loop videos
│   ├── index.html               # Homepage entry point
│   ├── styles.css               # Premium CSS layout system
│   └── script.js                # Mobile navigation and ScrollTrigger logic
├── package.json                 # Monorepo configuration
├── pnpm-workspace.yaml          # PNPM Workspace packages mapping
└── README.md                    # Detailed documentation
```

---

## ⚙️ Architecture & Data Flow

V01 is built as a hybrid desktop client, local API gateway, and companion mobile client. This architecture ensures complete file system access while utilizing isolated sandbox containers:

```mermaid
graph TD
    A[Electron Frontend - React] -->|IPC Bindings| B[Electron Main Process]
    A -->|HTTP / WebSockets| C[Local Fastify API Server]
    B -->|Spawns Subprocess| C
    C -->|Prisma Client| D[(SQLite database: v01.db)]
    C -->|API Requests| E[NVIDIA NIM / LLM Endpoints]
    A -->|Monaco Editor| F[Local Filesystem]
    B -->|Pty Spawner| G[Native Terminal Shell]
    H[Mobile Companion - Kotlin] -->|HTTP / WebSockets| C
```

### Stack Components:
1. **Desktop Shell:** Electron, managing secure preload bridges, file dialogs, window chromes (custom close/minimize bar), and PTY terminal session spawners.
2. **Local API Server:** Fastify running on `127.0.0.1:4310` to handle file searches, code analysis, LLM client connections, and database queries.
3. **Database Layer:** SQLite database accessed via Prisma ORM. Stores canvas layout locations, chat messages, workspaces settings, and staging state.
4. **Orchestrator:** Connects to remote AI endpoints (prioritizing NVIDIA NIM's DeepSeek V4 Flash) to run plan generation and execution steps.
5. **Mobile Synchronizer:** Exposed endpoints on Fastify host companion websockets to stream terminal execution prompts and fetch current canvas coordinates.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or later (v20+ recommended).
* **pnpm**: Global package manager (`npm install -g pnpm`).
* **Android Studio**: Required to build and run the Companion Mobile App.

### Installation
Clone the repository and install all project dependencies from the root directory:
```bash
pnpm install
```

### Running in Development
To start both the Fastify server and the Electron dev window concurrently:
```bash
npm run dev
```

If you are on Windows, you can double-click **`start-dev.bat`** in the root directory. This batch wrapper launches a PowerShell setup script that:
1. Validates that ports `4310` (API) and `5173` (Frontend) are clear.
2. Starts the backend and frontend in separate, non-colliding PowerShell logs.
3. Waits for the API to pass its `/health` check before showing the UI, preventing race condition errors.

---

## 🗃️ Database Schema & Data Models

The local database configuration uses Prisma and SQLite (`data/v01.db`). Below is a summary of the primary models defined in the database schema [schema.prisma](file:///a:/Aayush,s%20Stuff/v01/packages/database/prisma/schema.prisma):

| Model | Purpose | Key Attributes |
|---|---|---|
| **User** | Tracks user identities and global settings. | `id`, `email`, `displayName`, `metadataJson` |
| **Project** | Groups canvas sessions and file trackers. | `id`, `name`, `rootPath`, `lastOpenedAt` |
| **Session** | Visual card nodes on the prompt canvas. | `id`, `title`, `accent`, coordinates (`x`, `y`, `zoom`), `isMasterPlan` |
| **Message** | Chat logs associated with a canvas session. | `id`, `role` (user/assistant/system), `content`, `status` |
| **Task** | Checklist steps used inside Plan Mode. | `id`, `title`, `status` (pending/running/completed/error) |
| **FileArtifact** | Tracks files created or modified by AI plans. | `id`, `relativePath`, `kind` (created/modified/referenced), coordinates |
| **WorkspaceState** | Persists panel open states, coordinates, and active window widths. | `viewportX`, `viewportY`, `leftTab`, `terminalOpen`, `layoutJson` |
| **OpenTab** | Persists Monaco Editor open tabs. | `path`, `name`, `dirty`, `active`, `contentSnapshot` |
| **Preference** | Project and User specific preferences. | `id`, `key`, `valueJson` |
| **AIResponse** | Database history tracking LLM API usages. | `id`, `provider`, `model`, `prompt`, `response`, `inputTokens` |

---

## 📦 Packaging & Release Engineering

### Building the Installer
To bundle the frontend resources, compile the main process code, and pack the Windows installer executable (`V01 Setup.exe`):
```bash
npm run package
```
The output setup file will be saved under `apps/desktop/dist/installer/`.

### Security & Stability Controls
* **Single Instance Lock:** Main process uses `app.requestSingleInstanceLock()`. Duplicate launches of the IDE or installer will not bind duplicate ports; instead, they focus the existing active window and exit, preventing `EADDRINUSE: 4310` startup bugs.
* **Zombie Thread Protection:** On `will-quit` events, Electron triggers a complete `process.exit(0)` to instantly clean up database connections, Fastify listeners, and spawned terminal shells.
* **Expiration Date-Lock (Disabled):** Previously enforced a strict expiration check during `app.whenReady()`. This restriction has been removed to allow unlimited usage of the build.
