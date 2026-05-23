import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Loader2,
  Plus,
  Terminal,
  Trash2,
  Undo2,
  UserRound,
  X
} from "lucide-react";
import type {
  ChatSessionMessage,
  DiffLine,
  PromptClusterItem,
  PromptFile,
  TimelineEntry,
  TimelineEntryStatus
} from "../../stores/workspaceStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";

interface PromptClusterProps {
  cluster: PromptClusterItem;
  canvasScale: number;
}

// --- Progress Steps ---

interface WorkflowStep {
  id: string;
  label: string;
  status: "done" | "active" | "pending";
}

function deriveSteps(cluster: PromptClusterItem): WorkflowStep[] {
  const steps: WorkflowStep[] = [];
  const isRunning = cluster.status === "running";
  const isComplete = cluster.status === "completed";
  const isError = cluster.status === "error";
  const hasFiles = cluster.files.length > 0;
  const hasMessages = cluster.messages.length > 1;

  steps.push({
    id: "analyze",
    label: "Analyzing request",
    status: isRunning && !hasMessages ? "active" : (hasMessages || isComplete || isError) ? "done" : "pending"
  });

  if (isRunning || isComplete || isError) {
    steps.push({
      id: "plan",
      label: "Planning edits",
      status: isRunning && !hasFiles ? "active" : (hasFiles || isComplete) ? "done" : "pending"
    });
  }

  if (hasFiles || isComplete) {
    steps.push({
      id: "write",
      label: `Writing ${cluster.files.length} file${cluster.files.length !== 1 ? "s" : ""}`,
      status: isRunning ? "active" : "done"
    });
  }

  if (isComplete) steps.push({ id: "done", label: "Changes finalized", status: "done" });
  if (isError) steps.push({ id: "error", label: "Execution failed", status: "active" });

  return steps;
}

function StepBullet({ status }: { status: WorkflowStep["status"] }) {
  if (status === "done") {
    return (
      <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
        <Check size={10} strokeWidth={3} />
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="grid h-4 w-4 place-items-center text-purple-400">
        <span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
      </span>
    );
  }
  return (
    <span className="grid h-4 w-4 place-items-center text-zinc-600">
      <Circle size={8} />
    </span>
  );
}

function ProgressSection({ cluster }: { cluster: PromptClusterItem }) {
  const steps = deriveSteps(cluster);
  if (steps.length <= 1 && cluster.status === "pending") return null;

  return (
    <div className="border-b border-white/[0.04] px-4 py-3">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Progress</div>
      <div className="space-y-1">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-2">
            <StepBullet status={step.status} />
            <span className={`text-[11px] ${step.status === "done" ? "text-zinc-400" : step.status === "active" ? "text-zinc-200 font-medium" : "text-zinc-600"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Timeline Bullet ---

function TimelineBullet({ status }: { status: TimelineEntryStatus }) {
  if (status === "done") {
    return <span className="relative z-10 grid h-3 w-3 place-items-center rounded-full bg-emerald-500/25"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /></span>;
  }
  if (status === "active") {
    return <span className="relative z-10 grid h-3 w-3 place-items-center"><span className="h-2 w-2 animate-pulse rounded-full bg-purple-400" /></span>;
  }
  return <span className="relative z-10 grid h-3 w-3 place-items-center"><span className="h-1.5 w-1.5 rounded-full bg-zinc-600" /></span>;
}

// --- Timeline Entry: Text ---

function TimelineTextEntry({ entry }: { entry: TimelineEntry }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="text-[13px] leading-[1.5] text-zinc-400">
      {entry.text}
    </motion.div>
  );
}

// --- Timeline Entry: File Action (side-by-side diff) ---

function fileActionColor(type: TimelineEntry["type"]) {
  if (type === "file-read") return "bg-zinc-600/40 text-zinc-300";
  if (type === "file-write") return "bg-amber-500/20 text-amber-300";
  return "bg-teal-500/20 text-teal-300";
}

function fileActionLabel(type: TimelineEntry["type"]) {
  if (type === "file-read") return "Read";
  if (type === "file-write") return "Write";
  return "Edit";
}

function SideBySideDiff({ diffLines }: { diffLines: DiffLine[] }) {
  const removed = diffLines.filter((l) => l.type === "remove");
  const added = diffLines.filter((l) => l.type === "add");
  const maxRows = Math.max(removed.length, added.length);

  return (
    <div className="grid grid-cols-2 divide-x divide-white/[0.06] font-mono text-[11px] leading-[18px]">
      {/* Left: removed */}
      <div className="min-w-0 overflow-hidden">
        {Array.from({ length: maxRows }, (_, i) => {
          const line = removed[i];
          return (
            <div key={`r-${i}`} className={`flex ${line ? "bg-red-500/[0.08]" : ""}`}>
              <span className="w-[24px] shrink-0 select-none text-right pr-1.5 text-[10px] text-zinc-600">
                {line ? line.lineNumber : ""}
              </span>
              <span className={`flex-1 truncate pr-1 ${line ? "text-red-300/80" : ""}`}>
                {line ? line.content : ""}
              </span>
            </div>
          );
        })}
      </div>
      {/* Right: added */}
      <div className="min-w-0 overflow-hidden">
        {Array.from({ length: maxRows }, (_, i) => {
          const line = added[i];
          return (
            <div key={`a-${i}`} className={`flex ${line ? "bg-emerald-500/[0.08]" : ""}`}>
              <span className="w-[24px] shrink-0 select-none text-right pr-1.5 text-[10px] text-zinc-600">
                {line ? line.lineNumber : ""}
              </span>
              <span className={`flex-1 truncate pr-1 ${line ? "text-emerald-300/90" : ""}`}>
                {line ? line.content : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineFileEntry({ entry }: { entry: TimelineEntry }) {
  const [diffExpanded, setDiffExpanded] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <button
        type="button"
        onClick={() => entry.diffLines?.length && setDiffExpanded(!diffExpanded)}
        onPointerDown={(e) => e.stopPropagation()}
        className="group flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition hover:bg-white/[0.03]"
      >
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${fileActionColor(entry.type)}`}>
          {fileActionLabel(entry.type)}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-zinc-300">{entry.filePath}</span>
        {entry.linesAdded != null && (
          <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px]">
            <span className="text-emerald-400">+{entry.linesAdded}</span>
            <span className="text-red-400">-{entry.linesRemoved ?? 0}</span>
          </span>
        )}
        {entry.diffLines?.length ? (
          <ChevronRight size={11} className={`shrink-0 text-zinc-600 transition ${diffExpanded ? "rotate-90" : ""}`} />
        ) : null}
      </button>

      <AnimatePresence initial={false}>
        {diffExpanded && entry.diffLines && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="mt-2 max-h-[220px] overflow-y-auto rounded-md border border-white/[0.06] bg-[#0d1117]" data-card-scroll="true" onWheel={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-white/[0.04] px-3 py-1.5">
                <span className="font-mono text-[11px] text-zinc-400">{entry.filePath?.split("/").pop()}</span>
                {entry.linesAdded != null && (
                  <span className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="text-emerald-400">+{entry.linesAdded}</span>
                    <span className="text-red-400">-{entry.linesRemoved ?? 0}</span>
                  </span>
                )}
              </div>
              <SideBySideDiff diffLines={entry.diffLines} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Timeline Entry: Terminal ---

function TimelineTerminalEntry({ entry }: { entry: TimelineEntry }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="rounded-md border border-white/[0.06] bg-[#111] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/[0.04] px-3 py-1.5">
        <Terminal size={11} className="text-zinc-500" />
        <span className="text-[10px] font-semibold text-zinc-500">terminal</span>
        <span className="flex-1" />
        {entry.command && <span className="font-mono text-[11px] text-zinc-400">$ {entry.command}</span>}
      </div>
      {entry.outputLines && entry.outputLines.length > 0 && (
        <div className="px-3 py-2 font-mono text-[11px] leading-[18px]">
          {entry.outputLines.map((line, i) => (
            <div key={i} className={line.kind === "stdout" ? "text-[#a8b8a0]" : line.kind === "stderr" ? "text-[#e06c6c]" : line.kind === "success" ? "text-[#89c988]" : "text-[#555]"}>
              {line.text}
            </div>
          ))}
        </div>
      )}
      {entry.status === "active" && (
        <div className="flex items-center gap-2 px-3 py-2">
          <Loader2 size={10} className="animate-spin text-purple-400" />
          <span className="text-[11px] text-zinc-500">Running...</span>
        </div>
      )}
    </motion.div>
  );
}

// --- Chat Message (inline in timeline) ---

function ChatMessageEntry({ message }: { message: ChatSessionMessage }) {
  const isUser = message.role === "user";
  return (
    <div className="flex gap-2.5">
      <div className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md ${isUser ? "bg-blue-500/15 text-blue-400" : "bg-purple-500/15 text-purple-400"}`}>
        {isUser ? <UserRound size={11} /> : <Bot size={11} />}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-semibold text-zinc-300">{isUser ? "You" : "v01"}</span>
        <p className="whitespace-pre-wrap text-[12px] leading-[1.6] text-zinc-300/90 mt-0.5">{message.content}</p>
      </div>
    </div>
  );
}

// --- Combined Timeline + Chat (interleaved) ---

function TimelineBlock({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="relative ml-1 mt-1 mb-1 pl-4 border-l border-white/[0.06]">
      <div className="space-y-2.5">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-start gap-2.5">
            <div className="mt-1.5 shrink-0"><TimelineBullet status={entry.status} /></div>
            <div className="min-w-0 flex-1">
              {entry.type === "text" && <TimelineTextEntry entry={entry} />}
              {(entry.type === "file-read" || entry.type === "file-write" || entry.type === "file-edit") && <TimelineFileEntry entry={entry} />}
              {entry.type === "terminal" && <TimelineTerminalEntry entry={entry} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardBody({ cluster, timelineEntries }: { cluster: PromptClusterItem; timelineEntries: TimelineEntry[] }) {
  // Split timeline entries evenly across assistant messages that triggered file changes.
  // If there are no assistant messages with file context, show all entries after the last message.
  const assistantMessages = cluster.messages.filter((m) => m.role === "assistant");
  const entriesPerAssistant = assistantMessages.length > 0
    ? Math.ceil(timelineEntries.length / assistantMessages.length)
    : 0;

  // Build interleaved stream: for each message, if it's an assistant message,
  // attach its share of timeline entries after it.
  let timelineIdx = 0;
  const elements: React.ReactNode[] = [];

  for (const msg of cluster.messages) {
    elements.push(<ChatMessageEntry key={msg.id} message={msg} />);

    if (msg.role === "assistant" && entriesPerAssistant > 0 && timelineIdx < timelineEntries.length) {
      const chunk = timelineEntries.slice(timelineIdx, timelineIdx + entriesPerAssistant);
      elements.push(<TimelineBlock key={`tl-${msg.id}`} entries={chunk} />);
      timelineIdx += entriesPerAssistant;
    }
  }

  // Any remaining timeline entries (no assistant message to attach to)
  if (timelineIdx < timelineEntries.length) {
    elements.push(<TimelineBlock key="tl-remaining" entries={timelineEntries.slice(timelineIdx)} />);
  }

  // Running indicator
  if (cluster.status === "running" && cluster.messages[cluster.messages.length - 1]?.role !== "assistant") {
    elements.push(
      <div key="running" className="flex items-center gap-2 pt-1">
        <div className="grid h-5 w-5 place-items-center rounded-md bg-zinc-700/60 text-zinc-400"><Bot size={11} /></div>
        <Loader2 size={11} className="animate-spin text-purple-400" />
        <span className="text-[11px] text-zinc-500">v01 is working...</span>
      </div>
    );
  }

  return <div className="space-y-3 px-4 py-3">{elements}</div>;
}

// --- Derive timeline from cluster (only file/terminal entries, not chat) ---

function deriveTimelineFromCluster(cluster: PromptClusterItem): TimelineEntry[] {
  if (cluster.timeline.length > 0) return cluster.timeline;

  const entries: TimelineEntry[] = [];
  const isRunning = cluster.status === "running";
  let entryIdx = 0;

  for (const file of cluster.files) {
    const lines = file.mockContent.split("\n");
    const added = lines.length;
    const removed = file.kind === "modified" ? Math.max(1, Math.round(added * 0.15)) : 0;
    entries.push({
      id: file.id || `derived-file-${entryIdx++}`,
      type: file.kind === "created" ? "file-write" : "file-edit",
      status: isRunning ? "active" : "done",
      filePath: file.relativePath,
      linesAdded: added,
      linesRemoved: removed,
      lineRange: `${added} lines`,
      diffLines: [
        ...lines.slice(0, 6).map((content, i) => ({ type: "remove" as const, lineNumber: i + 1, content: `// old line ${i + 1}` })),
        ...lines.slice(0, 6).map((content, i) => ({ type: "add" as const, lineNumber: i + 1, content }))
      ]
    });
  }

  return entries;
}

// --- File Change Summary Footer ---

interface FileDiffStats { file: PromptFile; added: number; removed: number; }

function computeDiffStats(files: PromptFile[]): FileDiffStats[] {
  return files.map((file) => {
    const lines = file.mockContent.split("\n").length;
    if (file.kind === "created") return { file, added: lines, removed: 0 };
    return { file, added: lines, removed: Math.max(1, Math.round(lines * 0.15)) };
  });
}

function FileStatusDot({ kind }: { kind: PromptFile["kind"] }) {
  if (kind === "created") return <span className="h-2 w-2 shrink-0 rounded-full bg-blue-400" />;
  if (kind === "modified") return <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />;
  return <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />;
}

function FileChangeSummary({ cluster }: { cluster: PromptClusterItem }) {
  const openPromptFile = useWorkspaceStore((s) => s.openPromptFile);
  const [expanded, setExpanded] = useState(false);
  const [undoConfirm, setUndoConfirm] = useState(false);
  const [showAll, setShowAll] = useState(false);

  if (cluster.files.length === 0) return null;

  const stats = computeDiffStats(cluster.files);
  const totalAdded = stats.reduce((sum, s) => sum + s.added, 0);
  const totalRemoved = stats.reduce((sum, s) => sum + s.removed, 0);
  const displayedFiles = expanded ? (showAll ? stats : stats.slice(0, 3)) : [];

  return (
    <div className="border-t border-white/[0.04]" style={{ background: "var(--color-background-secondary, #0f1214)" }}>
      <button type="button" onClick={() => setExpanded(!expanded)} onPointerDown={(e) => e.stopPropagation()} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/[0.02]">
        <Plus size={13} className="shrink-0 text-zinc-400" />
        <span className="text-[13px] font-medium text-zinc-200">Edited {cluster.files.length} file{cluster.files.length !== 1 ? "s" : ""}</span>
        <span className="flex items-center gap-2 font-mono text-[12px]">
          <span className="text-emerald-400">+{totalAdded.toLocaleString()}</span>
          <span className="text-red-400">-{totalRemoved.toLocaleString()}</span>
        </span>
        <span className="flex-1" />
        <span className="relative flex items-center" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          {undoConfirm ? (
            <span className="flex items-center gap-2 text-[11px]">
              <span className="text-zinc-400">Undo all?</span>
              <button type="button" onClick={() => setUndoConfirm(false)} className="text-emerald-400 hover:text-emerald-300 font-medium">Confirm</button>
              <button type="button" onClick={() => setUndoConfirm(false)} className="text-zinc-500 hover:text-zinc-400">Cancel</button>
            </span>
          ) : (
            <button type="button" onClick={() => setUndoConfirm(true)} className="flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-300 transition">Undo <Undo2 size={11} /></button>
          )}
        </span>
        <button type="button" onClick={(e) => { e.stopPropagation(); stats.forEach(({ file }) => void openPromptFile(cluster.id, file.id)); }} onPointerDown={(e) => e.stopPropagation()} className="ml-2 text-[12px] text-zinc-500 hover:text-zinc-300 transition">Review</button>
        <ChevronDown size={13} className={`shrink-0 text-zinc-500 transition-transform duration-150 ${expanded ? "" : "-rotate-90"}`} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15, ease: "easeOut" }} className="overflow-hidden">
            <div className="border-t border-white/[0.03] px-4 pb-3 pt-1">
              {displayedFiles.map(({ file, added, removed }) => (
                <button key={file.id} type="button" onClick={() => void openPromptFile(cluster.id, file.id)} onPointerDown={(e) => e.stopPropagation()} className="group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left transition hover:bg-white/[0.03]">
                  <FileStatusDot kind={file.kind} />
                  <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-zinc-300 group-hover:text-white">{file.relativePath}</span>
                  <span className="flex shrink-0 items-center gap-2 font-mono text-[11px]"><span className="text-emerald-400">+{added}</span><span className="text-red-400">-{removed}</span></span>
                  <ChevronRight size={11} className="shrink-0 text-zinc-600 transition group-hover:text-zinc-400" />
                </button>
              ))}
              {!showAll && stats.length > 3 && (
                <button type="button" onClick={() => setShowAll(true)} onPointerDown={(e) => e.stopPropagation()} className="mt-1 px-2 text-[11px] text-zinc-600 hover:text-zinc-400 transition">
                  Show {stats.length - 3} more file{stats.length - 3 !== 1 ? "s" : ""} ↓
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main Component ---

import { Maximize2, Settings as SettingsIcon } from "lucide-react";

type CardSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CONFIGS: Record<CardSize, { width: number; maxHeight: number }> = {
  xs: { width: 420, maxHeight: 360 },
  sm: { width: 520, maxHeight: 440 },
  md: { width: 620, maxHeight: 540 },
  lg: { width: 740, maxHeight: 640 },
  xl: { width: 880, maxHeight: 760 },
};

function CardSettings({ size, onSizeChange }: { size: CardSize; onSizeChange: (s: CardSize) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="grid h-6 w-6 place-items-center rounded-[var(--radius-sm)] text-muted/50 transition hover:bg-surface/50 hover:text-ink"
        title="Card size"
      >
        <SettingsIcon size={12} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[130px] rounded-[var(--radius-md)] border border-line/40 bg-panel p-1.5 shadow-elevated" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          <div className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted/50">Size</div>
          <div className="flex gap-0.5 px-1">
            {(["xs","sm","md","lg","xl"] as CardSize[]).map((s) => (
              <button key={s} type="button" onClick={() => { onSizeChange(s); setOpen(false); }} className={`flex-1 rounded-[var(--radius-sm)] py-1 text-center text-[10px] font-semibold transition ${size === s ? "bg-brand/15 text-brand" : "text-muted hover:bg-surface/50 hover:text-ink"}`}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PromptCluster({ cluster, canvasScale }: PromptClusterProps) {
  const movePromptCluster = useWorkspaceStore((s) => s.movePromptCluster);
  const togglePromptCluster = useWorkspaceStore((s) => s.togglePromptCluster);
  const deletePromptCluster = useWorkspaceStore((s) => s.deletePromptCluster);
  const setActiveSession = useWorkspaceStore((s) => s.setActiveSession);
  const setExpandedSession = useWorkspaceStore((s) => s.setExpandedSession);
  const activeSessionId = useWorkspaceStore((s) => s.activeSessionId);
  const [isDragging, setIsDragging] = useState(false);
  const [cardSize, setCardSize] = useState<CardSize>("md");
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({ active: false, pointerId: -1, startClientX: 0, startClientY: 0, startX: 0, startY: 0 });
  const selected = activeSessionId === cluster.id;
  const timelineEntries = useMemo(() => deriveTimelineFromCluster(cluster), [cluster]);
  const cfg = SIZE_CONFIGS[cardSize];

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [cluster.messages.length, cluster.timeline.length, cluster.status]);

  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, textarea, input, form, [data-card-scroll='true'], [data-no-drag='true']")) return;
    setActiveSession(cluster.id);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragStateRef.current = { active: true, pointerId: event.pointerId, startClientX: event.clientX, startClientY: event.clientY, startX: cluster.x, startY: cluster.y };
    setIsDragging(true);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const ds = dragStateRef.current;
    if (!ds.active || ds.pointerId !== event.pointerId) return;
    const safeScale = Math.max(0.1, canvasScale);
    movePromptCluster(cluster.id, Math.round(ds.startX + (event.clientX - ds.startClientX) / safeScale), Math.round(ds.startY + (event.clientY - ds.startClientY) / safeScale));
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const ds = dragStateRef.current;
    if (!ds.active || ds.pointerId !== event.pointerId) return;
    dragStateRef.current.active = false;
    setIsDragging(false);
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch {}
  };

  return (
    <motion.article
      data-canvas-interactive="true"
      initial={false}
      animate={{ opacity: 1, scale: cluster.zoom * (isDragging ? 1.003 : 1) }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      onPointerDown={beginDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`absolute left-0 top-0 select-none overflow-hidden rounded-[var(--radius-lg)] border bg-panel ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        width: cfg.width,
        x: cluster.x,
        y: cluster.y,
        borderColor: selected ? "rgba(94, 196, 160, 0.2)" : "rgba(255, 255, 255, 0.04)",
        boxShadow: selected
          ? "0 0 0 1px rgba(94, 196, 160, 0.06), 0 20px 60px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.2)"
          : "0 12px 40px rgba(0, 0, 0, 0.35), 0 3px 10px rgba(0, 0, 0, 0.15)"
      }}
      onClick={() => { if (!isDragging) setActiveSession(cluster.id); }}
    >
      {/* Header — the title area is the drag handle */}
      <div className="flex items-center gap-2 border-b border-line/30 bg-surface/15 px-3 py-2 cursor-grab">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); togglePromptCluster(cluster.id); }}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-[var(--radius-sm)] text-muted/50 transition hover:bg-surface/50 hover:text-ink"
        >
          {cluster.expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        <div className={`h-2 w-2 shrink-0 rounded-full ${cluster.status === "running" ? "bg-brand animate-pulse" : cluster.status === "completed" ? "bg-emerald-400" : cluster.status === "error" ? "bg-red-400" : "bg-muted/30"}`} />

        <h3 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink/90 tracking-tight select-none">{cluster.title}</h3>

        {/* Expand to workspace */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setExpandedSession(cluster.id); }}
          className="grid h-6 w-6 place-items-center rounded-[var(--radius-sm)] text-muted/40 transition hover:bg-brand/10 hover:text-brand"
          title="Open in workspace"
        >
          <Maximize2 size={12} />
        </button>

        {/* Size settings */}
        <CardSettings size={cardSize} onSizeChange={setCardSize} />

        {/* Delete */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete this session permanently?")) deletePromptCluster(cluster.id); }}
          className="grid h-6 w-6 place-items-center rounded-[var(--radius-sm)] text-muted/30 transition hover:bg-red-500/10 hover:text-red-400"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Body */}
      <AnimatePresence initial={false}>
        {cluster.expanded && (
          <motion.div
            key={`${cluster.id}-body`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <ProgressSection cluster={cluster} />

            <div ref={scrollRef} data-card-scroll="true" className="overflow-y-auto" style={{ maxHeight: cfg.maxHeight }} onWheel={(e) => e.stopPropagation()}>
              <CardBody cluster={cluster} timelineEntries={timelineEntries} />
            </div>

            {/* Inline chat input */}
            <CardChatInput clusterId={cluster.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

// --- Inline Card Chat Input ---

function CardChatInput({ clusterId }: { clusterId: string }) {
  const sendPromptToSession = useWorkspaceStore((s) => s.sendPromptToSession);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    void sendPromptToSession(clusterId, text);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-line/30 px-3 py-2" onPointerDown={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-line/30 bg-canvas/40 px-2.5 py-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up..."
          className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted/40"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-brand text-canvas transition hover:brightness-110 disabled:opacity-30"
        >
          <ArrowUp size={12} />
        </button>
      </div>
    </form>
  );
}
