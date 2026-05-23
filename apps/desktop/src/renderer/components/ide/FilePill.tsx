import { motion } from "framer-motion";
import { FileCode2, FilePlus2, Layers3, PencilLine } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { PromptFile } from "../../stores/workspaceStore";

interface FilePillProps {
  file: PromptFile;
  accent: string;
  highlighted: boolean;
  selected: boolean;
  muted: boolean;
  dragging?: boolean;
  onClick: () => void;
  onPointerDown?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerCancel?: (event: ReactPointerEvent<HTMLButtonElement>) => void;
}

const nodeVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 340, damping: 30 }
  }
} as const;

function FileKindIcon({ file }: { file: PromptFile }) {
  if (file.kind === "created") {
    return <FilePlus2 size={14} />;
  }

  if (file.kind === "modified") {
    return <PencilLine size={14} />;
  }

  if (file.previewKind === "stack") {
    return <Layers3 size={14} />;
  }

  return <FileCode2 size={14} />;
}

function codeTone(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "text-muted/35";
  if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return "text-emerald-300/70";
  if (/^(import|export)\b/.test(trimmed)) return "text-sky-300/95";
  if (/\b(const|let|function|return|from|type|interface)\b/.test(trimmed)) return "text-cyan-200/95";
  if (trimmed.includes("\"") || trimmed.includes("'")) return "text-amber-200/90";
  return "text-ink/82";
}

function codeLines(file: PromptFile): string[] {
  const lines = file.mockContent
    .split(/\r?\n/)
    .filter((line, index, allLines) => index < 24 || allLines.length <= 24);
  if (lines.length > 0) {
    return lines.slice(0, 24);
  }
  return [file.relativePath, "", ...file.preview.map((line) => `// ${line}`)];
}

export function FilePill({
  file,
  accent,
  highlighted,
  selected,
  muted,
  dragging = false,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel
}: FilePillProps) {
  const isActive = highlighted || selected;
  const lines = codeLines(file);

  return (
    <motion.button
      variants={nodeVariants}
      whileHover={{ scale: dragging ? 1 : 1.012 }}
      whileTap={{ scale: 0.995 }}
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onClick}
      title={`Open ${file.relativePath}`}
      className={`group w-[292px] select-none text-left transition ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{ opacity: muted ? 0.42 : 1 }}
    >
      <div className="mb-2 flex items-center gap-2 px-1">
        <span
          className="grid h-6 w-6 place-items-center rounded-md border bg-panel/95 shadow-[0_8px_22px_rgba(0,0,0,0.28)]"
          style={{
            borderColor: selected ? `${accent}80` : "rgb(var(--color-line-rgb) / 0.72)",
            color: isActive ? accent : "rgb(var(--color-muted-rgb) / 0.95)"
          }}
        >
          <FileKindIcon file={file} />
        </span>
        <span className="min-w-0 truncate text-[13px] font-semibold text-ink drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]">
          {file.name}
        </span>
      </div>

      <div
        className="h-[360px] overflow-hidden rounded-xl border bg-[#111518] shadow-[0_22px_60px_rgba(0,0,0,0.42)]"
        style={{
          borderColor: selected ? `${accent}88` : "rgb(var(--color-line-rgb) / 0.72)",
          boxShadow: selected
            ? `0 24px 66px rgba(0,0,0,0.46), 0 0 0 1px ${accent}4d`
            : "0 22px 60px rgba(0,0,0,0.40)"
        }}
      >
        <div className="flex h-7 items-center justify-between border-b border-line/60 bg-panel/70 px-3">
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-muted/80">
            {file.kind}
          </span>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
        </div>

        <pre className="h-[333px] overflow-hidden px-3 py-2 font-mono text-[10px] leading-[15px]">
          {lines.map((line, index) => (
            <div key={`${file.id}-${index}`} className="flex min-w-0 gap-3">
              <span className="w-5 shrink-0 select-none text-right text-muted/35">{index + 1}</span>
              <code className={`min-w-0 truncate ${codeTone(line)}`}>{line || " "}</code>
            </div>
          ))}
        </pre>
      </div>
    </motion.button>
  );
}
