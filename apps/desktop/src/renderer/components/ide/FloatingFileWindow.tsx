import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Editor from "@monaco-editor/react";
import { GripHorizontal, Save, X } from "lucide-react";
import type { FloatingFile } from "../../stores/workspaceStore";
import { selectThemePalette, useWorkspaceStore } from "../../stores/workspaceStore";
import { isDarkPalette } from "../../theme";

interface FloatingFileWindowProps {
  file: FloatingFile;
  canvasScale: number;
}

export function FloatingFileWindow({ file, canvasScale }: FloatingFileWindowProps) {
  const moveFloatingFile = useWorkspaceStore((s) => s.moveFloatingFile);
  const resizeFloatingFile = useWorkspaceStore((s) => s.resizeFloatingFile);
  const updateFloatingFileContent = useWorkspaceStore((s) => s.updateFloatingFileContent);
  const saveFloatingFile = useWorkspaceStore((s) => s.saveFloatingFile);
  const closeFloatingFile = useWorkspaceStore((s) => s.closeFloatingFile);
  const palette = useWorkspaceStore(selectThemePalette);
  const monacoTheme = isDarkPalette(palette) ? "vs-dark" : "vs";

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, fileX: 0, fileY: 0 });
  const resizeRef = useRef({ startX: 0, startY: 0, startW: 0, startH: 0 });

  const beginDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, fileX: file.x, fileY: file.y };
    setIsDragging(true);
  };

  const moveDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const scale = Math.max(0.1, canvasScale);
    const dx = (e.clientX - dragRef.current.startX) / scale;
    const dy = (e.clientY - dragRef.current.startY) / scale;
    moveFloatingFile(file.id, Math.round(dragRef.current.fileX + dx), Math.round(dragRef.current.fileY + dy));
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };

  const beginResize = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: file.width, startH: file.height };
    setIsResizing(true);
  };

  const moveResize = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    const scale = Math.max(0.1, canvasScale);
    const dw = (e.clientX - resizeRef.current.startX) / scale;
    const dh = (e.clientY - resizeRef.current.startY) / scale;
    resizeFloatingFile(file.id, Math.round(resizeRef.current.startW + dw), Math.round(resizeRef.current.startH + dh));
  };

  const endResize = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    setIsResizing(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };

  return (
    <div
      data-canvas-interactive="true"
      className="absolute left-0 top-0 flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line/30 bg-panel shadow-card"
      style={{
        transform: `translate(${file.x}px, ${file.y}px)`,
        width: file.width,
        height: file.height
      }}
    >
      {/* Title bar - draggable */}
      <div
        className={`flex h-8 shrink-0 items-center gap-2 border-b border-line/40 bg-surface/30 px-3 ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <GripHorizontal size={12} className="shrink-0 text-zinc-600" />
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-zinc-300">
          {file.name}
        </span>
        {file.dirty && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />}
        <button
          type="button"
          className="grid h-5 w-5 shrink-0 place-items-center rounded text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300 disabled:opacity-40"
          onClick={() => void saveFloatingFile(file.id)}
          disabled={!file.dirty}
          title="Save"
        >
          <Save size={12} />
        </button>
        <button
          type="button"
          className="grid h-5 w-5 shrink-0 place-items-center rounded text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300"
          onClick={() => closeFloatingFile(file.id)}
          title="Close"
        >
          <X size={12} />
        </button>
      </div>

      {/* Editor body */}
      <div className="min-h-0 flex-1">
        <Editor
          key={file.path}
          path={file.path}
          value={file.content}
          language={file.language}
          theme={monacoTheme}
          onChange={(value) => updateFloatingFileContent(file.id, value ?? "")}
          options={{
            automaticLayout: true,
            fontSize: 12,
            lineHeight: 19,
            minimap: { enabled: false },
            padding: { top: 8, bottom: 8 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            wordWrap: "on",
            lineNumbers: "on",
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 3
          }}
        />
      </div>

      {/* Resize handle - bottom right corner */}
      <div
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        onPointerDown={beginResize}
        onPointerMove={moveResize}
        onPointerUp={endResize}
        onPointerCancel={endResize}
      >
        <svg className="absolute bottom-1 right-1 text-zinc-600" width="8" height="8" viewBox="0 0 8 8">
          <path d="M7 1L1 7M7 4L4 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
