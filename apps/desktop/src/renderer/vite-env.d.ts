/// <reference types="vite/client" />

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

declare global {
  interface Window {
    v01: {
      platform: string;
      workspace: {
        openFolder: () => Promise<OpenFolderResult | null>;
        refreshTree: (rootPath: string) => Promise<FileTreeNode>;
        readFile: (filePath: string) => Promise<ReadFileResult>;
        saveFile: (input: SaveFileInput) => Promise<SaveFileResult>;
        resolvePath: (input: ResolvePathInput) => Promise<ResolvePathResult>;
      };
      terminal: {
        runCommand: (input: RunTerminalCommandInput) => Promise<RunTerminalCommandResult>;
        killCommand: (commandId: string) => Promise<boolean>;
        onData: (callback: (event: TerminalDataEvent) => void) => () => void;
        onExit: (callback: (event: TerminalExitEvent) => void) => () => void;
      };
      window: {
        minimize: () => Promise<boolean>;
        close: () => Promise<boolean>;
        toggleMaximize: () => Promise<boolean>;
        isMaximized: () => Promise<boolean>;
        onMaximizedChange: (callback: (maximized: boolean) => void) => () => void;
      };
    };
  };
}

export {};
