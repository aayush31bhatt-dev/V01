import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";
import type {
  FileTreeNode,
  OpenFolderResult,
  ReadFileResult,
  ResolvePathInput,
  ResolvePathResult,
  RunTerminalCommandInput,
  RunTerminalCommandResult,
  SaveFileInput,
  SaveFileResult,
  TerminalDataEvent,
  TerminalExitEvent
} from "../shared/ide";

contextBridge.exposeInMainWorld("v01", {
  platform: process.platform,
  workspace: {
    openFolder: (): Promise<OpenFolderResult | null> =>
      ipcRenderer.invoke("workspace:open-folder"),
    refreshTree: (rootPath: string): Promise<FileTreeNode> =>
      ipcRenderer.invoke("workspace:refresh-tree", rootPath),
    readFile: (filePath: string): Promise<ReadFileResult> =>
      ipcRenderer.invoke("workspace:read-file", filePath),
    saveFile: (input: SaveFileInput): Promise<SaveFileResult> =>
      ipcRenderer.invoke("workspace:save-file", input),
    resolvePath: (input: ResolvePathInput): Promise<ResolvePathResult> =>
      ipcRenderer.invoke("workspace:resolve-path", input)
  },
  terminal: {
    runCommand: (input: RunTerminalCommandInput): Promise<RunTerminalCommandResult> =>
      ipcRenderer.invoke("terminal:run-command", input),
    killCommand: (commandId: string): Promise<boolean> =>
      ipcRenderer.invoke("terminal:kill-command", commandId),
    onData: (callback: (event: TerminalDataEvent) => void): (() => void) => {
      const listener = (_event: IpcRendererEvent, payload: TerminalDataEvent) => {
        callback(payload);
      };
      ipcRenderer.on("terminal:data", listener);
      return () => ipcRenderer.removeListener("terminal:data", listener);
    },
    onExit: (callback: (event: TerminalExitEvent) => void): (() => void) => {
      const listener = (_event: IpcRendererEvent, payload: TerminalExitEvent) => {
        callback(payload);
      };
      ipcRenderer.on("terminal:exit", listener);
      return () => ipcRenderer.removeListener("terminal:exit", listener);
    }
  },
  window: {
    minimize: (): Promise<boolean> => ipcRenderer.invoke("window:minimize"),
    close: (): Promise<boolean> => ipcRenderer.invoke("window:close"),
    toggleMaximize: (): Promise<boolean> => ipcRenderer.invoke("window:toggle-maximize"),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke("window:is-maximized"),
    onMaximizedChange: (callback: (maximized: boolean) => void): (() => void) => {
      const listener = (_event: IpcRendererEvent, maximized: boolean) => {
        callback(maximized);
      };
      ipcRenderer.on("window:maximized-changed", listener);
      return () => ipcRenderer.removeListener("window:maximized-changed", listener);
    }
  }
});
