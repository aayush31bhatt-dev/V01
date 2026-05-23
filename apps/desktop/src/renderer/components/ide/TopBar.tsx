import { useEffect, useState } from "react";
import {
  FolderOpen,
  Maximize2,
  Minimize2,
  Minus,
  Pause,
  Play,
  Settings,
  SquareTerminal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  X
} from "lucide-react";
import { useWorkspaceStore } from "../../stores/workspaceStore";

interface TopBarProps {
  leftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  rightSidebarOpen?: boolean;
  onToggleRightSidebar?: () => void;
}

export function TopBar({
  leftSidebarOpen = true,
  onToggleLeftSidebar,
  rightSidebarOpen = true,
  onToggleRightSidebar
}: TopBarProps) {
  const [maximized, setMaximized] = useState(false);
  const projectName = useWorkspaceStore((state) => state.projectName);
  const rootPath = useWorkspaceStore((state) => state.rootPath);
  const loadingLabel = useWorkspaceStore((state) => state.loadingLabel);
  const openFolder = useWorkspaceStore((state) => state.openFolder);
  const queueTerminalCommand = useWorkspaceStore((state) => state.queueTerminalCommand);
  const setLeftTab = useWorkspaceStore((state) => state.setLeftTab);
  const terminalOpen = useWorkspaceStore((state) => state.terminalOpen);
  const setTerminalOpen = useWorkspaceStore((state) => state.setTerminalOpen);

  useEffect(() => {
    void window.v01.window.isMaximized().then(setMaximized);
    return window.v01.window.onMaximizedChange((next) => {
      setMaximized(next);
    });
  }, []);

  return (
    <header className="drag-region flex h-[42px] shrink-0 items-center justify-between border-b border-line/50 bg-panel/80 px-3">
      {/* Left section */}
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          className="no-drag iconButton"
          type="button"
          onClick={onToggleLeftSidebar}
          title={leftSidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          {leftSidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </button>

        <div className="mx-1 h-[18px] w-px bg-line/40" />

        <div className="no-drag flex min-w-0 items-center gap-2">
          <span className="text-[14px] font-semibold tracking-tight text-ink/90">v01</span>
          <span className="text-[13px] text-muted/70">—</span>
          <span className="truncate text-[13px] text-muted">{projectName}</span>
        </div>
      </div>

      {/* Center: status */}
      <div className="flex items-center gap-2">
        {loadingLabel && (
          <span className="flex items-center gap-1.5 rounded-full bg-brand/8 px-2.5 py-0.5 text-[10px] font-medium text-brand">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            {loadingLabel}
          </span>
        )}
      </div>

      {/* Right section */}
      <div className="no-drag flex items-center gap-0.5">
        <button className="toolbarButton" type="button" onClick={openFolder}>
          <FolderOpen size={13} />
          Open
        </button>
        <button
          className="toolbarButton"
          type="button"
          disabled={!rootPath}
          onClick={() => queueTerminalCommand("npm run dev")}
          title="Run dev server"
        >
          <Play size={13} />
          Run
        </button>
        {!terminalOpen && (
          <button className="toolbarButton" type="button" onClick={() => setTerminalOpen(true)} title="Terminal">
            <SquareTerminal size={13} />
          </button>
        )}
        <button className="toolbarButton" type="button" disabled title="Pause execution">
          <Pause size={13} />
        </button>

        <div className="mx-1 h-[18px] w-px bg-line/40" />

        <button className="iconButton" type="button" onClick={onToggleRightSidebar} title={rightSidebarOpen ? "Close editor" : "Open editor"}>
          {rightSidebarOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
        </button>
        <button className="iconButton" type="button" onClick={() => setLeftTab("settings")} title="Settings">
          <Settings size={13} />
        </button>

        <div className="mx-0.5 h-[18px] w-px bg-line/40" />

        <button className="iconButton" type="button" title="Minimize" onClick={() => void window.v01.window.minimize()}>
          <Minus size={13} />
        </button>
        <button className="iconButton" type="button" title={maximized ? "Restore" : "Maximize"} onClick={() => void window.v01.window.toggleMaximize()}>
          {maximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
        <button
          className="iconButton hover:!bg-red-500/15 hover:!text-red-400"
          type="button"
          title="Close"
          onClick={() => void window.v01.window.close()}
        >
          <X size={13} />
        </button>
      </div>
    </header>
  );
}
