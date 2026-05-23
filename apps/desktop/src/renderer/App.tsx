import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CenterWorkspace } from "./components/ide/CenterWorkspace";
import { LeftSidebar } from "./components/ide/LeftSidebar";
import { RightSidebar } from "./components/ide/RightSidebar";
import { TerminalPanel } from "./components/ide/TerminalPanel";
import { TopBar } from "./components/ide/TopBar";
import { selectThemePalette, startWorkspacePersistence, useWorkspaceStore } from "./stores/workspaceStore";
import { hexToRgbTriplet, isDarkPalette } from "./theme";

export function App() {
  const MIN_LEFT_SIDEBAR_WIDTH = 220;
  const MAX_LEFT_SIDEBAR_WIDTH = 520;
  const MIN_RIGHT_SIDEBAR_WIDTH = 320;
  const MAX_RIGHT_SIDEBAR_WIDTH = 720;
  const error = useWorkspaceStore((state) => state.error);
  const clearError = useWorkspaceStore((state) => state.clearError);
  const palette = useWorkspaceStore(selectThemePalette);
  const hydrateWorkspace = useWorkspaceStore((state) => state.hydrateWorkspace);
  const panelLayout = useWorkspaceStore((state) => state.panelLayout);
  const setPanelLayout = useWorkspaceStore((state) => state.setPanelLayout);
  const leftSidebarWidth = panelLayout.leftSidebarWidth;
  const rightSidebarWidth = panelLayout.rightSidebarWidth;
  const leftSidebarOpen = panelLayout.leftSidebarOpen;
  const rightSidebarOpen = panelLayout.rightSidebarOpen;
  const setLeftSidebarWidth = (w: number) => setPanelLayout({ leftSidebarWidth: w });
  const setRightSidebarWidth = (w: number) => setPanelLayout({ rightSidebarWidth: w });
  const setLeftSidebarOpen = (open: boolean) => setPanelLayout({ leftSidebarOpen: open });
  const setRightSidebarOpen = (open: boolean) => setPanelLayout({ rightSidebarOpen: open });
  const leftDragStartXRef = useRef(0);
  const leftDragStartWidthRef = useRef(leftSidebarWidth);
  const rightDragStartXRef = useRef(0);
  const rightDragStartWidthRef = useRef(rightSidebarWidth);

  useEffect(() => {
    startWorkspacePersistence();
    void hydrateWorkspace();
  }, [hydrateWorkspace]);

  useEffect(() => {
    const root = document.documentElement;
    const entries = [
      ["--color-canvas", palette.canvas],
      ["--color-panel", palette.panel],
      ["--color-surface", palette.surface],
      ["--color-ink", palette.ink],
      ["--color-muted", palette.muted],
      ["--color-line", palette.line],
      ["--color-brand", palette.brand],
      ["--color-accent", palette.accent],
      ["--color-terminal", palette.terminal],
      ["--color-terminal-text", palette.terminalText],
      ["--color-terminal-selection", palette.terminalSelection]
    ] as const;

    entries.forEach(([name, hex]) => {
      try {
        root.style.setProperty(`${name}-rgb`, hexToRgbTriplet(hex));
        root.style.setProperty(name, hex);
      } catch (e) {
        console.warn(`Failed to set theme property ${name} with value ${hex}`);
      }
    });
    root.dataset.theme = isDarkPalette(palette) ? "dark" : "light";
  }, [palette]);

  const startLeftSidebarResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    leftDragStartXRef.current = event.clientX;
    leftDragStartWidthRef.current = leftSidebarWidth;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = leftDragStartWidthRef.current + (moveEvent.clientX - leftDragStartXRef.current);
      const clampedWidth = Math.min(MAX_LEFT_SIDEBAR_WIDTH, Math.max(MIN_LEFT_SIDEBAR_WIDTH, nextWidth));
      setLeftSidebarWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  const startRightSidebarResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    rightDragStartXRef.current = event.clientX;
    rightDragStartWidthRef.current = rightSidebarWidth;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextWidth = rightDragStartWidthRef.current - (moveEvent.clientX - rightDragStartXRef.current);
      const clampedWidth = Math.min(MAX_RIGHT_SIDEBAR_WIDTH, Math.max(MIN_RIGHT_SIDEBAR_WIDTH, nextWidth));
      setRightSidebarWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-canvas text-ink">
      <TopBar
        leftSidebarOpen={leftSidebarOpen}
        onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
        rightSidebarOpen={rightSidebarOpen}
        onToggleRightSidebar={() => setRightSidebarOpen(!rightSidebarOpen)}
      />
      <section
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{
          gridTemplateColumns: `${leftSidebarOpen ? leftSidebarWidth : 0}px ${leftSidebarOpen ? 1 : 0}px minmax(0, 1fr) ${rightSidebarOpen ? 1 : 0}px ${rightSidebarOpen ? rightSidebarWidth : 0}px`
        }}
      >
        <div className="flex flex-col overflow-hidden min-h-0">
          <LeftSidebar />
        </div>
        <div
          className={`cursor-ew-resize bg-line/30 transition hover:bg-brand/40 ${!leftSidebarOpen ? 'pointer-events-none' : ''}`}
          onPointerDown={startLeftSidebarResize}
          title="Resize left sidebar"
        />
        <div className="flex min-w-0 flex-col bg-[var(--workspace-middle)]">
          <CenterWorkspace />
          <TerminalPanel />
        </div>
        <div
          className={`cursor-ew-resize bg-line/30 transition hover:bg-brand/40 ${!rightSidebarOpen ? 'pointer-events-none' : ''}`}
          onPointerDown={startRightSidebarResize}
          title="Resize right sidebar"
        />
        <div className="flex flex-col overflow-hidden min-h-0">
          <RightSidebar />
        </div>
      </section>

      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-4 right-4 z-50 max-w-sm rounded-[var(--radius-md)] border border-red-500/30 bg-surface px-4 py-3 text-[12px] text-red-300 shadow-elevated"
            role="alert"
          >
            <div className="flex items-start justify-between gap-3">
              <span>{error}</span>
              <button
                className="rounded-[var(--radius-sm)] px-2 py-0.5 text-[11px] font-medium text-red-400 transition hover:bg-red-500/10"
                type="button"
                onClick={clearError}
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
