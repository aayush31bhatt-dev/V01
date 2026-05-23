import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { ChevronDown, SquareTerminal, Trash2 } from "lucide-react";
import { selectThemePalette, useWorkspaceStore } from "../../stores/workspaceStore";

function normalizeCommandInput(data: string): string | null {
  if (data === "\r") {
    return "enter";
  }
  if (data === "\u007F") {
    return "backspace";
  }
  if (data >= " " && data !== "\u007F") {
    return data;
  }
  return null;
}

export function TerminalPanel() {
  const MIN_TERMINAL_HEIGHT = 72;
  const MAX_TERMINAL_HEIGHT = 520;
  const COLLAPSE_THRESHOLD = 64;
  const DEFAULT_TERMINAL_HEIGHT = 192;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef("");
  const cwdRef = useRef<string | null>(null);
  const terminalOpenRef = useRef(true);
  const dragStartYRef = useRef(0);
  const dragStartHeightRef = useRef(0);
  const terminalOpen = useWorkspaceStore((state) => state.terminalOpen);
  const setTerminalOpen = useWorkspaceStore((state) => state.setTerminalOpen);
  const rootPath = useWorkspaceStore((state) => state.rootPath);
  const queuedCommand = useWorkspaceStore((state) => state.queuedCommand);
  const consumeQueuedCommand = useWorkspaceStore((state) => state.consumeQueuedCommand);
  const palette = useWorkspaceStore(selectThemePalette);
  const [cwd, setCwd] = useState<string | null>(rootPath);
  const [terminalHeight, setTerminalHeight] = useState(DEFAULT_TERMINAL_HEIGHT);

  useEffect(() => {
    setCwd(rootPath);
    cwdRef.current = rootPath;
  }, [rootPath]);

  useEffect(() => {
    cwdRef.current = cwd;
  }, [cwd]);

  useEffect(() => {
    terminalOpenRef.current = terminalOpen;
    if (terminalOpen) {
      window.setTimeout(() => {
        try {
          if (containerRef.current && containerRef.current.clientWidth > 0) {
            fitAddonRef.current?.fit();
          }
        } catch (e) {}
      }, 40);
    }
  }, [terminalOpen]);

  useEffect(() => {
    if (terminalOpen) {
      setTerminalHeight((value) => (value < MIN_TERMINAL_HEIGHT ? DEFAULT_TERMINAL_HEIGHT : value));
    }
  }, [terminalOpen]);

  useEffect(() => {
    if (!terminalOpen) {
      return;
    }
    window.setTimeout(() => {
      try {
        if (containerRef.current && containerRef.current.clientWidth > 0) {
          fitAddonRef.current?.fit();
        }
      } catch (e) {}
    }, 0);
  }, [terminalHeight, terminalOpen]);

  useEffect(() => {
    if (!containerRef.current || terminalRef.current) {
      return;
    }

    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: "SFMono-Regular, Consolas, Liberation Mono, monospace",
      fontSize: 12,
      lineHeight: 1.45,
      theme: {
        background: palette.terminal,
        foreground: palette.terminalText,
        cursor: palette.terminalText,
        selectionBackground: palette.terminalSelection
      }
    });
    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);
    try {
      if (containerRef.current.clientWidth > 0) {
        fitAddon.fit();
      }
    } catch (e) {}
    terminal.write("v01 terminal ready\r\n");
    terminal.write("$ ");

    const runCommand = async (command: string): Promise<void> => {
      const trimmed = command.trim();
      if (!trimmed) {
        terminal.write("$ ");
        return;
      }

      if (trimmed === "clear") {
        terminal.clear();
        terminal.write("$ ");
        return;
      }

      if (trimmed === "cd" || trimmed.startsWith("cd ")) {
        try {
          const result = await window.v01.workspace.resolvePath({
            cwd: cwdRef.current,
            target: trimmed.slice(2).trim()
          });
          cwdRef.current = result.path;
          setCwd(result.path);
          terminal.write(`${result.path}\r\n$ `);
        } catch (error) {
          terminal.write(`${error instanceof Error ? error.message : "Unable to change directory"}\r\n$ `);
        }
        return;
      }

      try {
        await window.v01.terminal.runCommand({
          command: trimmed,
          cwd: cwdRef.current
        });
      } catch (error) {
        terminal.write(`${error instanceof Error ? error.message : "Command failed"}\r\n$ `);
      }
    };

    terminal.onData((data) => {
      const normalized = normalizeCommandInput(data);
      if (!normalized) {
        return;
      }

      if (normalized === "enter") {
        const command = inputBufferRef.current;
        inputBufferRef.current = "";
        terminal.write("\r\n");
        void runCommand(command);
        return;
      }

      if (normalized === "backspace") {
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          terminal.write("\b \b");
        }
        return;
      }

      inputBufferRef.current += normalized;
      terminal.write(normalized);
    });

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const removeDataListener = window.v01.terminal.onData((event) => {
      terminal.write(event.data.replace(/\n/g, "\r\n"));
    });
    const removeExitListener = window.v01.terminal.onExit((event) => {
      terminal.write(`\r\n[exit ${event.code ?? "unknown"}]\r\n$ `);
    });
    const resizeObserver = new ResizeObserver(() => {
      if (terminalOpenRef.current && containerRef.current && containerRef.current.clientWidth > 0) {
        try {
          fitAddon.fit();
        } catch (e) {
          // ignore fit error on 0 size
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      removeDataListener();
      removeExitListener();
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }
    terminal.options.theme = {
      background: palette.terminal,
      foreground: palette.terminalText,
      cursor: palette.terminalText,
      selectionBackground: palette.terminalSelection
    };
  }, [palette]);

  useEffect(() => {
    if (!queuedCommand || !terminalRef.current) {
      return;
    }

    const terminal = terminalRef.current;
    const command = queuedCommand.command;
    terminal.write(`${command}\r\n`);
    inputBufferRef.current = "";
    void window.v01.terminal.runCommand({
      command,
      cwd
    });
    consumeQueuedCommand();
  }, [consumeQueuedCommand, cwd, queuedCommand]);

  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = event.clientY;
    dragStartHeightRef.current = terminalHeight;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextHeight = dragStartHeightRef.current - (moveEvent.clientY - dragStartYRef.current);
      const clampedHeight = Math.min(MAX_TERMINAL_HEIGHT, Math.max(MIN_TERMINAL_HEIGHT, nextHeight));
      setTerminalHeight(clampedHeight);
    };
    const handlePointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      const latestHeight = dragStartHeightRef.current - (upEvent.clientY - dragStartYRef.current);
      if (latestHeight <= COLLAPSE_THRESHOLD) {
        setTerminalOpen(false);
      }
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  if (!terminalOpen) {
    return null;
  }

  return (
    <section className="shrink-0 border-t border-line/70 bg-[var(--workspace-shade)] text-ink">
      <div
        className="h-1 cursor-ns-resize bg-transparent hover:bg-line/40"
        onPointerDown={startResize}
        title="Resize terminal"
      />
      <div className="flex h-9 items-center justify-between border-b border-line/70 bg-panel/45 px-3">
        <button
          className="inline-flex items-center gap-2 rounded-md px-1.5 py-1 text-xs font-semibold text-ink/90 transition hover:bg-surface/60"
          type="button"
          onClick={() => setTerminalOpen(false)}
        >
          <SquareTerminal size={15} />
          Terminal
          <ChevronDown size={14} />
        </button>
        <div className="flex min-w-0 items-center gap-2">
          <span className="max-w-[420px] truncate text-xs text-ink/60">{cwd ?? "No project folder"}</span>
          <button
            className="grid h-7 w-7 place-items-center rounded-md text-ink/70 transition hover:bg-surface/70 hover:text-ink"
            type="button"
            title="Clear terminal"
            onClick={() => terminalRef.current?.clear()}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="min-h-0 p-2.5" style={{ height: terminalHeight }}>
        <div ref={containerRef} className="h-full w-full overflow-hidden rounded-md border border-line/60 bg-terminal" />
      </div>
    </section>
  );
}
