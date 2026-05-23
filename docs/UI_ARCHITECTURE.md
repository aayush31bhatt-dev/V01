# Desktop UI Architecture

The current UI is a real desktop IDE foundation. It intentionally does not include AI agents, voice input, autonomous execution, or backend AI orchestration.

## Layout

- **Top bar:** app identity, project name/path, open-folder action, run shortcut, pause placeholder, settings shortcut.
- **Left sidebar:** file explorer, file search, Git/history placeholder, settings placeholder.
- **Center workspace:** Monaco editor, file tabs, open-file state, dirty indicator, save action.
- **Right sidebar:** future AI workspace placeholders for prompt, tasks, and execution history.
- **Bottom panel:** collapsible xterm.js terminal.

## Runtime Boundaries

The renderer never reads local files directly. Electron main owns filesystem and command access through IPC:

- `workspace:open-folder`
- `workspace:refresh-tree`
- `workspace:read-file`
- `workspace:save-file`
- `workspace:resolve-path`
- `terminal:run-command`
- `terminal:kill-command`

Preload exposes these as a narrow `window.v01` API.

## State

Zustand owns client state in `apps/desktop/src/renderer/stores/workspaceStore.ts`:

- current project
- file tree
- open editor tabs
- active file
- dirty file contents
- left-sidebar tab
- terminal visibility
- queued terminal commands

## Future Extension Points

- Replace the simple command runner with a PTY-backed terminal when interactive shell behavior is required.
- Add Git status to the left history tab.
- Connect the right sidebar to task planning and execution history after AI workflows are designed.
- Add editor commands, command palette, diff viewer, and file create/rename/delete actions.

