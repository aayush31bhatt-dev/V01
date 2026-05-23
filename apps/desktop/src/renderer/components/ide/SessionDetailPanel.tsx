import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  FileCode2,
  Loader2,
  Minimize2,
  Paperclip,
  Plus,
  Terminal,
  UserRound,
  X
} from "lucide-react";
import type {
  ChatSessionMessage,
  PromptClusterItem,
  PromptFile,
  TimelineEntry,
  TimelineEntryStatus
} from "../../stores/workspaceStore";
import { GEMINI_MODELS, useWorkspaceStore } from "../../stores/workspaceStore";

function timestampLabel(value: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

// --- Progress ---

function ProgressSteps({ cluster }: { cluster: PromptClusterItem }) {
  const isRunning = cluster.status === "running";
  const isComplete = cluster.status === "completed";
  const isError = cluster.status === "error";
  const hasFiles = cluster.files.length > 0;
  const hasMessages = cluster.messages.length > 1;

  const steps = [
    { id: "analyze", label: "Analyzing", status: isRunning && !hasMessages ? "active" : (hasMessages || isComplete || isError) ? "done" : "pending" },
    { id: "plan", label: "Planning", status: isRunning && !hasFiles ? "active" : (hasFiles || isComplete) ? "done" : "pending" },
    { id: "execute", label: "Executing", status: isRunning && hasFiles ? "active" : isComplete ? "done" : "pending" },
    { id: "done", label: isError ? "Failed" : "Complete", status: isComplete ? "done" : isError ? "active" : "pending" },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center gap-1">
          {i > 0 && <div className={`h-px w-4 ${step.status === "done" ? "bg-brand/40" : "bg-line/40"}`} />}
          <div className={`h-2 w-2 rounded-full ${step.status === "done" ? "bg-brand" : step.status === "active" ? "bg-brand animate-pulse" : "bg-line/60"}`} />
          <span className={`text-[11px] ${step.status === "done" ? "text-brand/80" : step.status === "active" ? "text-ink font-medium" : "text-muted/40"}`}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

// --- Chat Message ---

function ChatMessage({ message }: { message: ChatSessionMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "" : ""}`}>
      <div className={`mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-[var(--radius-md)] ${isUser ? "bg-blue-500/10 text-blue-400" : "bg-brand/10 text-brand"}`}>
        {isUser ? <UserRound size={14} /> : <Bot size={14} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[13px] font-semibold ${isUser ? "text-ink/80" : "text-brand/90"}`}>{isUser ? "You" : "v01"}</span>
          <span className="text-[11px] text-muted/40">{timestampLabel(message.createdAt)}</span>
          {message.status === "streaming" && (
            <span className="flex items-center gap-1 text-[11px] text-brand">
              <Loader2 size={10} className="animate-spin" /> thinking
            </span>
          )}
        </div>
        <div className="text-[14px] leading-[1.7] text-ink/85 whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
}

// --- File Change Item ---

function FileChangeItem({ file, clusterId }: { file: PromptFile; clusterId: string }) {
  const openPromptFile = useWorkspaceStore((s) => s.openPromptFile);
  const lines = file.mockContent.split("\n").length;
  const removed = file.kind === "modified" ? Math.max(1, Math.round(lines * 0.15)) : 0;

  return (
    <button
      type="button"
      onClick={() => void openPromptFile(clusterId, file.id)}
      className="group flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-left transition hover:bg-surface/40"
    >
      <FileCode2 size={14} className="shrink-0 text-muted/50 group-hover:text-ink/70" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-ink/80 group-hover:text-ink">{file.name}</div>
        <div className="truncate text-[11px] text-muted/50">{file.relativePath}</div>
      </div>
      <span className={`shrink-0 rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold ${file.kind === "created" ? "bg-brand/12 text-brand" : "bg-amber-500/12 text-amber-400"}`}>
        {file.kind === "created" ? "new" : "mod"}
      </span>
      <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px]">
        <span className="text-emerald-400">+{lines}</span>
        {removed > 0 && <span className="text-red-400">-{removed}</span>}
      </span>
    </button>
  );
}

// --- Task Item ---

function TaskItem({ task }: { task: { id: string; title: string; status: string } }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5">
      {task.status === "completed" ? (
        <Check size={13} className="shrink-0 text-brand" />
      ) : task.status === "running" ? (
        <Loader2 size={13} className="shrink-0 animate-spin text-brand" />
      ) : (
        <Circle size={11} className="shrink-0 text-muted/30" />
      )}
      <span className={`text-[13px] ${task.status === "completed" ? "text-ink/70" : task.status === "running" ? "text-ink font-medium" : "text-muted/50"}`}>{task.title}</span>
    </div>
  );
}

// --- Timeline Entry ---

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  if (entry.type === "terminal") {
    return (
      <div className="rounded-[var(--radius-sm)] border border-line/25 bg-canvas/40 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line/20 px-3 py-1.5">
          <Terminal size={12} className="text-muted/50" />
          <span className="text-[11px] font-medium text-muted/50">terminal</span>
          <span className="flex-1" />
          {entry.command && <span className="font-mono text-[12px] text-muted/60">$ {entry.command}</span>}
        </div>
        {entry.outputLines && (
          <div className="px-3 py-2 font-mono text-[12px] leading-[18px]">
            {entry.outputLines.map((line, i) => (
              <div key={i} className={line.kind === "stdout" ? "text-[#a8b8a0]" : line.kind === "stderr" ? "text-[#e06c6c]" : line.kind === "success" ? "text-[#7bc97b]" : "text-muted/30"}>{line.text}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (entry.type === "file-read" || entry.type === "file-write" || entry.type === "file-edit") {
    const color = entry.type === "file-write" ? "bg-amber-500/15 text-amber-400" : "bg-brand/12 text-brand";
    const label = entry.type === "file-read" ? "Read" : entry.type === "file-write" ? "Write" : "Edit";
    return (
      <div className="flex items-center gap-2 px-1 py-0.5">
        <span className={`shrink-0 rounded-[3px] px-1.5 py-0.5 text-[10px] font-semibold ${color}`}>{label}</span>
        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink/60">{entry.filePath}</span>
        {entry.linesAdded != null && (
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-emerald-400">+{entry.linesAdded}</span>
            <span className="text-red-400">-{entry.linesRemoved ?? 0}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="text-[13px] text-muted/70 px-1">{entry.text}</div>
  );
}

// --- Main Panel ---

export function SessionDetailPanel() {
  const expandedSessionId = useWorkspaceStore((s) => s.expandedSessionId);
  const setExpandedSession = useWorkspaceStore((s) => s.setExpandedSession);
  const sendPromptToSession = useWorkspaceStore((s) => s.sendPromptToSession);
  const prompts = useWorkspaceStore((s) => s.prompts);
  const cluster = prompts.find((p) => p.id === expandedSessionId);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [cluster?.messages.length, cluster?.status]);

  if (!cluster) return null;

  const submitDraft = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    void sendPromptToSession(cluster.id, text);
    setDraft("");
  };

  const hasFiles = cluster.files.length > 0;
  const hasTasks = cluster.tasks.length > 0;
  const hasTimeline = cluster.timeline.length > 0;

  return (
    <div className="absolute inset-0 flex flex-col bg-[var(--workspace-middle)]">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-line/40 bg-panel/50 px-5 py-3">
        <div className={`h-2 w-2 rounded-full ${cluster.status === "running" ? "bg-brand animate-pulse" : cluster.status === "completed" ? "bg-emerald-400" : cluster.status === "error" ? "bg-red-400" : "bg-muted/30"}`} />
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink/90">{cluster.title}</h2>
        <ProgressSteps cluster={cluster} />
        <button
          type="button"
          onClick={() => setExpandedSession(null)}
          className="ml-2 grid h-7 w-7 place-items-center rounded-[var(--radius-sm)] text-muted/60 transition hover:bg-surface/60 hover:text-ink"
          title="Collapse to card"
        >
          <Minimize2 size={14} />
        </button>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="mx-auto max-w-[800px] px-6 py-5">
          {/* Chat messages interleaved with timeline */}
          <div className="space-y-5">
            {cluster.messages.map((msg, idx) => (
              <div key={msg.id}>
                <ChatMessage message={msg} />

                {/* Show timeline entries after assistant messages */}
                {msg.role === "assistant" && hasTimeline && (
                  <div className="ml-10 mt-2 space-y-1.5 border-l-2 border-brand/15 pl-4">
                    {cluster.timeline
                      .filter((_, ti) => {
                        const assistantCount = cluster.messages.filter((m) => m.role === "assistant").length;
                        const entriesPerMsg = Math.ceil(cluster.timeline.length / assistantCount);
                        const msgIdx = cluster.messages.filter((m) => m.role === "assistant").indexOf(msg);
                        return ti >= msgIdx * entriesPerMsg && ti < (msgIdx + 1) * entriesPerMsg;
                      })
                      .map((entry) => <TimelineItem key={entry.id} entry={entry} />)}
                  </div>
                )}
              </div>
            ))}

            {/* Running indicator */}
            {cluster.status === "running" && cluster.messages[cluster.messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-center gap-3 ml-10">
                <Loader2 size={14} className="animate-spin text-brand" />
                <span className="text-[13px] text-muted/60">v01 is working...</span>
              </div>
            )}
          </div>

          {/* Tasks section */}
          {hasTasks && (
            <div className="mt-6 rounded-[var(--radius-md)] border border-line/30 bg-surface/15 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-line/20 px-4 py-2.5">
                <Check size={13} className="text-brand/70" />
                <span className="text-[12px] font-semibold uppercase tracking-wider text-muted/50">Tasks</span>
                <span className="text-[11px] text-muted/40">{cluster.tasks.filter((t) => t.status === "completed").length}/{cluster.tasks.length}</span>
              </div>
              <div className="py-1">
                {cluster.tasks.map((task) => <TaskItem key={task.id} task={task} />)}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Input area */}
      <InputSection cluster={cluster} draft={draft} setDraft={setDraft} submitDraft={submitDraft} />
    </div>
  );
}

// --- Input Section with files changed, context, model ---

function InputSection({ cluster, draft, setDraft, submitDraft }: { cluster: PromptClusterItem; draft: string; setDraft: (v: string) => void; submitDraft: (e: FormEvent) => void }) {
  const selectedModel = useWorkspaceStore((s) => s.selectedModel);
  const setSelectedModel = useWorkspaceStore((s) => s.setSelectedModel);
  const openPromptFile = useWorkspaceStore((s) => s.openPromptFile);
  const [modelOpen, setModelOpen] = useState(false);
  const [filesExpanded, setFilesExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addChatAttachment = useWorkspaceStore((s) => s.addChatAttachment);
  const chatAttachments = useWorkspaceStore((s) => s.chatAttachments);
  const removeChatAttachment = useWorkspaceStore((s) => s.removeChatAttachment);

  const files = cluster.files;
  const totalAdded = files.reduce((sum, f) => sum + f.mockContent.split("\n").length, 0);
  const totalRemoved = files.reduce((sum, f) => f.kind === "modified" ? sum + Math.max(1, Math.round(f.mockContent.split("\n").length * 0.15)) : sum, 0);

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputFiles = event.target.files;
    if (!inputFiles) return;
    for (const file of Array.from(inputFiles)) {
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const content = isImage ? result.split(",")[1] ?? "" : result;
        addChatAttachment({
          id: `attach-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          type: isImage ? "image" : "file",
          mimeType: file.type || "text/plain",
          content,
          size: file.size
        });
      };
      if (isImage) reader.readAsDataURL(file);
      else reader.readAsText(file);
    }
    event.target.value = "";
  };

  return (
    <div className="shrink-0 border-t border-line/40 bg-panel/60">
      {/* Files changed bar */}
      {files.length > 0 && (
        <div className="border-b border-line/25 px-5">
          <button
            type="button"
            onClick={() => setFilesExpanded(!filesExpanded)}
            className="flex w-full items-center gap-2 py-2 text-left"
          >
            <ChevronRight size={12} className={`shrink-0 text-muted/50 transition ${filesExpanded ? "rotate-90" : ""}`} />
            <span className="text-[13px] text-ink/70">{files.length} files changed</span>
            <span className="flex items-center gap-1.5 font-mono text-[12px]">
              <span className="text-emerald-400">+{totalAdded}</span>
              <span className="text-red-400">-{totalRemoved}</span>
            </span>
            <span className="flex-1" />
          </button>

          <AnimatePresence initial={false}>
            {filesExpanded && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="pb-2 space-y-0.5">
                  {files.map((file) => {
                    const lines = file.mockContent.split("\n").length;
                    const removed = file.kind === "modified" ? Math.max(1, Math.round(lines * 0.15)) : 0;
                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => void openPromptFile(cluster.id, file.id)}
                        className="group flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1 text-left hover:bg-surface/30"
                      >
                        <Plus size={10} className="shrink-0 text-muted/30" />
                        <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink/60 group-hover:text-ink/80">{file.relativePath}</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <span className="text-emerald-400">+{lines}</span>
                          {removed > 0 && <span className="text-red-400">-{removed}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Context files (attachments) */}
      {chatAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 py-2 border-b border-line/20">
          {chatAttachments.map((att) => (
            <span key={att.id} className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-line/40 bg-surface/30 px-2 py-1 text-[12px] text-muted">
              <FileCode2 size={11} />
              <span className="max-w-[140px] truncate">{att.name}</span>
              <button type="button" onClick={() => removeChatAttachment(att.id)} className="grid h-4 w-4 place-items-center rounded hover:bg-surface/60 hover:text-ink">
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Prompt input row */}
      <form onSubmit={submitDraft} className="px-5 py-3">
        <div className="mx-auto max-w-[800px]">
          <div className="flex items-end gap-2 rounded-[var(--radius-md)] border border-line/40 bg-canvas/40 px-3 py-2">
            <textarea
              className="min-h-[28px] max-h-32 w-full flex-1 resize-none bg-transparent text-[14px] leading-6 text-ink outline-none placeholder:text-muted/50"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Describe what to build"
              rows={1}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitDraft(e); } }}
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-brand text-canvas transition hover:brightness-110 disabled:opacity-35"
            >
              <ArrowUp size={14} />
            </button>
          </div>

          {/* Bottom toolbar: attach, model, context */}
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-[12px] text-muted/60 transition hover:bg-surface/40 hover:text-ink"
            >
              <Plus size={12} />
            </button>
            <input ref={fileInputRef} type="file" multiple accept="image/*,.txt,.ts,.tsx,.js,.jsx,.py,.json,.md,.css,.html" onChange={handleFileAttach} className="hidden" />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-[12px] text-muted/60 transition hover:bg-surface/40 hover:text-ink"
            >
              <Paperclip size={12} />
              <span>Attach</span>
            </button>

            <div className="h-3 w-px bg-line/30" />

            {/* Model selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModelOpen(!modelOpen)}
                className="flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-[12px] text-muted/60 transition hover:bg-surface/40 hover:text-ink"
              >
                {GEMINI_MODELS.find((m) => m.id === selectedModel)?.label ?? "Auto"}
                <ChevronDown size={10} />
              </button>
              {modelOpen && (
                <div className="absolute bottom-full left-0 mb-1 z-50 min-w-[170px] rounded-[var(--radius-md)] border border-line/50 bg-panel p-1 shadow-elevated">
                  {GEMINI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => { setSelectedModel(model.id); setModelOpen(false); }}
                      className={`flex w-full items-center rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-[12px] transition ${selectedModel === model.id ? "bg-brand/12 text-brand" : "text-muted hover:bg-surface/50 hover:text-ink"}`}
                    >
                      {model.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
