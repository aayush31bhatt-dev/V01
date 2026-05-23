import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import type { OpenDialogOptions } from "electron";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import type { Dirent } from "node:fs";
import { basename, extname, isAbsolute, join, resolve } from "node:path";
import type {
  FileTreeNode,
  OpenFolderResult,
  ReadFileResult,
  ResolvePathInput,
  ResolvePathResult,
  RunTerminalCommandInput,
  RunTerminalCommandResult,
  SaveFileInput,
  SaveFileResult
} from "../shared/ide";

let mainWindow: BrowserWindow | null = null;
const runningCommands = new Map<string, ReturnType<typeof spawn>>();

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
  maximized: boolean;
}

const windowStatePath = resolve(process.cwd(), ".v01-electron-storage", "window-state.json");

function loadWindowState(): WindowState {
  try {
    const raw = require("fs").readFileSync(windowStatePath, "utf8");
    const state = JSON.parse(raw) as WindowState;
    if (state.width && state.height) return state;
  } catch {}
  return { width: 1280, height: 820, maximized: false };
}

function saveWindowState(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    const bounds = mainWindow.getBounds();
    const state: WindowState = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      maximized: mainWindow.isMaximized()
    };
    const dir = resolve(process.cwd(), ".v01-electron-storage");
    require("fs").mkdirSync(dir, { recursive: true });
    require("fs").writeFileSync(windowStatePath, JSON.stringify(state), "utf8");
  } catch {}
}

const excludedDirectoryNames = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vite",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out"
]);

const languageByExtension = new Map<string, string>([
  [".cjs", "javascript"],
  [".css", "css"],
  [".html", "html"],
  [".js", "javascript"],
  [".json", "json"],
  [".jsx", "javascript"],
  [".md", "markdown"],
  [".mjs", "javascript"],
  [".py", "python"],
  [".rs", "rust"],
  [".sql", "sql"],
  [".ts", "typescript"],
  [".tsx", "typescript"],
  [".yaml", "yaml"],
  [".yml", "yaml"]
]);
function configureElectronStorage() {
  const customStoragePath = resolve(process.cwd(), ".v01-electron-storage");
  app.setPath("userData", customStoragePath);
  app.setPath("cache", join(customStoragePath, "Cache"));
  app.commandLine.appendSwitch("disk-cache-dir", join(customStoragePath, "ChromiumCache"));
}

configureElectronStorage();
function inferLanguage(filePath: string): string {
  return languageByExtension.get(extname(filePath).toLowerCase()) ?? "plaintext";
}

async function buildFileTree(rootPath: string, depth = 0): Promise<FileTreeNode> {
  const stats = await fs.stat(rootPath);
  const node: FileTreeNode = {
    id: rootPath,
    name: basename(rootPath),
    path: rootPath,
    type: stats.isDirectory() ? "directory" : "file"
  };

  if (!stats.isDirectory() || depth >= 8) {
    return node;
  }

  let entries: Dirent[];
  try {
    entries = await fs.readdir(rootPath, { withFileTypes: true });
  } catch {
    node.children = [];
    return node;
  }

  const visibleEntries = entries
    .filter((entry) => !entry.isSymbolicLink())
    .filter((entry) => !entry.isDirectory() || !excludedDirectoryNames.has(entry.name))
    .sort((first, second) => {
      if (first.isDirectory() !== second.isDirectory()) {
        return first.isDirectory() ? -1 : 1;
      }
      return first.name.localeCompare(second.name);
    })
    .slice(0, 500);

  const children = await Promise.all(
    visibleEntries.map(async (entry) => {
      try {
        return await buildFileTree(join(rootPath, entry.name), depth + 1);
      } catch {
        return null;
      }
    })
  );
  node.children = children.filter((child): child is FileTreeNode => child !== null);

  return node;
}

function registerWorkspaceIpc(): void {
  ipcMain.handle("workspace:open-folder", async (): Promise<OpenFolderResult | null> => {
    const openFolderOptions: OpenDialogOptions = {
      title: "Open Project Folder",
      properties: ["openDirectory"]
    };
    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, openFolderOptions)
      : await dialog.showOpenDialog(openFolderOptions);

    if (result.canceled || !result.filePaths[0]) {
      return null;
    }

    const rootPath = result.filePaths[0];
    return {
      rootPath,
      projectName: basename(rootPath),
      tree: await buildFileTree(rootPath)
    };
  });

  ipcMain.handle(
    "workspace:refresh-tree",
    async (_event, rootPath: string): Promise<FileTreeNode> => buildFileTree(rootPath)
  );

  ipcMain.handle("workspace:read-file", async (_event, filePath: string): Promise<ReadFileResult> => {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      throw new Error("Cannot open a directory in the editor.");
    }
    if (stats.size > 5 * 1024 * 1024) {
      throw new Error("File is larger than the current 5 MB editor limit.");
    }

    const buffer = await fs.readFile(filePath);
    if (buffer.includes(0)) {
      throw new Error("Binary files are not supported in the editor yet.");
    }

    return {
      path: filePath,
      name: basename(filePath),
      content: buffer.toString("utf8"),
      language: inferLanguage(filePath),
      size: stats.size,
      mtimeMs: stats.mtimeMs
    };
  });

  ipcMain.handle(
    "workspace:save-file",
    async (_event, input: SaveFileInput): Promise<SaveFileResult> => {
      await fs.writeFile(input.path, input.content, "utf8");
      const stats = await fs.stat(input.path);
      return {
        path: input.path,
        savedAt: new Date().toISOString(),
        mtimeMs: stats.mtimeMs
      };
    }
  );

  ipcMain.handle(
    "workspace:resolve-path",
    async (_event, input: ResolvePathInput): Promise<ResolvePathResult> => {
      const fallbackCwd = input.cwd ?? process.cwd();
      const target = input.target.trim() || app.getPath("home");
      const resolvedPath =
        target === "~"
          ? app.getPath("home")
          : isAbsolute(target)
            ? target
            : resolve(fallbackCwd, target);
      const stats = await fs.stat(resolvedPath);

      if (!stats.isDirectory()) {
        throw new Error("Target path is not a directory.");
      }

      return {
        path: resolvedPath
      };
    }
  );
}

function registerTerminalIpc(): void {
  ipcMain.handle(
    "terminal:run-command",
    async (event, input: RunTerminalCommandInput): Promise<RunTerminalCommandResult> => {
      const command = input.command.trim();
      if (!command) {
        throw new Error("Command cannot be empty.");
      }

      const commandId = randomUUID();
      const child = spawn(command, {
        cwd: input.cwd ?? process.cwd(),
        env: process.env,
        shell: true,
        windowsHide: true
      });

      runningCommands.set(commandId, child);

      child.stdout?.on("data", (chunk: Buffer) => {
        event.sender.send("terminal:data", {
          commandId,
          data: chunk.toString()
        });
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        event.sender.send("terminal:data", {
          commandId,
          data: chunk.toString()
        });
      });

      child.on("error", (error) => {
        event.sender.send("terminal:data", {
          commandId,
          data: `${error.message}\r\n`
        });
      });

      child.on("close", (code) => {
        runningCommands.delete(commandId);
        event.sender.send("terminal:exit", {
          commandId,
          code
        });
      });

      return { commandId };
    }
  );

  ipcMain.handle("terminal:kill-command", async (_event, commandId: string): Promise<boolean> => {
    const child = runningCommands.get(commandId);
    if (!child) {
      return false;
    }
    child.kill();
    runningCommands.delete(commandId);
    return true;
  });
}

function registerWindowIpc(): void {
  ipcMain.handle("window:minimize", async (event): Promise<boolean> => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (!targetWindow) {
      return false;
    }
    targetWindow.minimize();
    return true;
  });

  ipcMain.handle("window:close", async (event): Promise<boolean> => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (!targetWindow) {
      return false;
    }
    targetWindow.close();
    return true;
  });

  ipcMain.handle("window:toggle-maximize", async (event): Promise<boolean> => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    if (!targetWindow) {
      return false;
    }
    if (targetWindow.isMaximized()) {
      targetWindow.unmaximize();
    } else {
      targetWindow.maximize();
    }
    return true;
  });

  ipcMain.handle("window:is-maximized", async (event): Promise<boolean> => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);
    return targetWindow?.isMaximized() ?? false;
  });
}

function createMainWindow(): void {
  const savedState = loadWindowState();

  mainWindow = new BrowserWindow({
    width: savedState.width,
    height: savedState.height,
    x: savedState.x,
    y: savedState.y,
    minWidth: 1040,
    minHeight: 680,
    title: "v01",
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: "#0c0f0e",
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (savedState.maximized) {
    mainWindow.maximize();
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window:maximized-changed", true);
  });

  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window:maximized-changed", false);
  });

  mainWindow.on("close", () => {
    saveWindowState();
  });

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message} (${sourceId}:${line})`);
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerWorkspaceIpc();
  registerTerminalIpc();
  registerWindowIpc();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  saveWindowState();
});
