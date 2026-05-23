import Editor from "@monaco-editor/react";
import { FileCode2, Save, X } from "lucide-react";
import { selectActiveFile, selectThemePalette, useWorkspaceStore } from "../../stores/workspaceStore";
import { isDarkPalette } from "../../theme";

export function RightSidebar() {
  const openFiles = useWorkspaceStore((state) => state.openFiles);
  const activeFile = useWorkspaceStore(selectActiveFile);
  const setActiveFile = useWorkspaceStore((state) => state.setActiveFile);
  const closeFile = useWorkspaceStore((state) => state.closeFile);
  const updateActiveFileContent = useWorkspaceStore((state) => state.updateActiveFileContent);
  const saveActiveFile = useWorkspaceStore((state) => state.saveActiveFile);
  const palette = useWorkspaceStore(selectThemePalette);
  const monacoTheme = isDarkPalette(palette) ? "vs-dark" : "vs";

  return (
    <aside className="flex h-full min-h-0 min-w-[320px] flex-col bg-panel/60">
      <div className="flex h-9 shrink-0 items-center justify-between overflow-hidden border-b border-line/40 bg-panel/40">
        <div className="flex min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
          {openFiles.length ? (
            openFiles.map((file) => (
              <div
                className={`editorTab ${activeFile?.path === file.path ? "editorTabActive" : ""}`}
                key={file.path}
                title={file.path}
              >
                <button
                  className="flex min-w-0 flex-1 items-center gap-2"
                  type="button"
                  onClick={() => setActiveFile(file.path)}
                >
                  <FileCode2 className="shrink-0" size={14} />
                  <span className="truncate">{file.name}</span>
                  {file.dirty ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> : null}
                </button>
                <button
                  className="grid h-5 w-5 shrink-0 place-items-center rounded hover:bg-canvas/70"
                  type="button"
                  onClick={() => closeFile(file.path)}
                  title="Close file"
                >
                  <X size={13} />
                </button>
              </div>
            ))
          ) : (
            <div className="flex items-center px-3 text-xs text-muted">No files open</div>
          )}
        </div>
        <button
          className="mr-2 inline-flex h-7 items-center gap-1.5 rounded-md border border-line/70 bg-surface/55 px-2 text-xs font-semibold text-muted transition hover:border-brand/50 hover:text-ink disabled:opacity-40"
          type="button"
          onClick={() => void saveActiveFile()}
          disabled={!activeFile?.dirty}
          title="Save active file"
        >
          <Save size={14} />
          Save
        </button>
      </div>
      <div className="min-h-0 flex-1">
        {activeFile ? (
          <Editor
            key={activeFile.path}
            path={activeFile.path}
            value={activeFile.content}
            language={activeFile.language}
            theme={monacoTheme}
            onChange={(value) => updateActiveFileContent(value ?? "")}
            options={{
              automaticLayout: true,
              fontSize: 13,
              lineHeight: 21,
              minimap: { enabled: false },
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              wordWrap: "on"
            }}
          />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center text-xs text-muted">
            <div className="rounded-lg border border-dashed border-line/80 bg-panel/45 px-5 py-4">
              Open a file to edit here
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
