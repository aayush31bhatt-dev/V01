import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Loader2,
  Pause,
  Trash2
} from "lucide-react";
import type { PromptClusterItem, PromptClusterStatus } from "../../stores/workspaceStore";

const statusConfig: Record<PromptClusterStatus, { label: string; dotClass: string }> = {
  pending: { label: "Queued", dotClass: "bg-zinc-400" },
  running: { label: "Running", dotClass: "bg-purple-400 animate-pulse" },
  paused: { label: "Paused", dotClass: "bg-amber-400" },
  completed: { label: "Completed", dotClass: "bg-emerald-400" },
  error: { label: "Error", dotClass: "bg-red-400" }
};

function StatusIcon({ status }: { status: PromptClusterStatus }) {
  if (status === "running") return <Loader2 size={12} className="animate-spin" />;
  if (status === "completed") return <CheckCircle2 size={12} />;
  if (status === "error") return <AlertTriangle size={12} />;
  if (status === "paused") return <Pause size={12} />;
  return <Circle size={12} />;
}

interface PromptCardProps {
  cluster: PromptClusterItem;
  selected: boolean;
  onToggleCollapse: () => void;
  onDelete: () => void;
}

export function PromptCard({ cluster, selected, onToggleCollapse, onDelete }: PromptCardProps) {
  const config = statusConfig[cluster.status];
  const filesCount = cluster.files.length;
  const linesChanged = cluster.files.reduce((acc, f) => acc + f.mockContent.split("\n").length, 0);

  return (
    <div className="flex items-center gap-3 border-b border-line/40 bg-surface/20 px-4 py-2">
      <button
        className="grid h-6 w-6 shrink-0 place-items-center rounded-[var(--radius-sm)] text-muted transition hover:bg-surface/60 hover:text-ink"
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onToggleCollapse}
        title={cluster.expanded ? "Collapse" : "Expand"}
      >
        {cluster.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={`h-2 w-2 shrink-0 rounded-full ${config.dotClass}`} />
        <h3 className="min-w-0 truncate text-[13px] font-semibold text-zinc-100 tracking-tight">
          {cluster.title}
        </h3>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {cluster.status === "running" && (
          <span className="flex items-center gap-1.5 rounded-md border border-purple-500/20 bg-purple-500/[0.08] px-2 py-0.5 text-[10px] font-medium text-purple-400">
            <StatusIcon status={cluster.status} />
            {config.label}
          </span>
        )}
        {cluster.status === "completed" && filesCount > 0 && (
          <span className="text-[11px] font-medium text-zinc-500">
            {filesCount} file{filesCount !== 1 ? "s" : ""} · {linesChanged} lines
          </span>
        )}
        {cluster.status === "error" && (
          <span className="flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/[0.08] px-2 py-0.5 text-[10px] font-medium text-red-400">
            <StatusIcon status={cluster.status} />
            {config.label}
          </span>
        )}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="grid h-6 w-6 place-items-center rounded-md text-zinc-600 transition hover:bg-red-500/10 hover:text-red-400 ml-1"
          title="Delete card"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
