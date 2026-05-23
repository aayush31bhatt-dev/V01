import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent
} from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
  type MotionValue
} from "framer-motion";
import { ArrowUp, ChevronDown, Image, LocateFixed, Minus, Paperclip, Plus, X } from "lucide-react";
import type { ChatAttachment, PromptCanvasSpawn, PromptClusterItem } from "../../stores/workspaceStore";
import { GEMINI_MODELS, useWorkspaceStore } from "../../stores/workspaceStore";
import { CircuitTraceBackground, TopographicBackground } from "./CanvasBackgrounds";
import { FloatingFileWindow } from "./FloatingFileWindow";
import { PromptCluster } from "./PromptCluster";
import { TextSelectionPopover } from "./TextSelectionPopover";

const MIN_ZOOM = 0.28;
const MAX_ZOOM = 2.15;
const DEFAULT_ZOOM = 1;
const suggestionPrompts = [
  "Create a login page",
  "Build a project dashboard",
  "Refactor the navbar",
  "Design settings flow"
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function CanvasOriginMarkings() {
  return (
    <div className="pointer-events-none absolute left-0 top-0" aria-hidden="true">
      {/* Origin dot */}
      <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-ink/20" />
      {/* Origin axes */}
      <div className="absolute left-0 top-[-8000px] h-[16000px] w-[1px] bg-ink/10" />
      <div className="absolute left-[-8000px] top-0 h-[1px] w-[16000px] bg-ink/10" />
      <div className="absolute left-2 top-2 select-none text-[10px] font-semibold text-ink/30">(0,0)</div>

      {/* Grid lines and labels */}
      {[-6000, -4000, -2000, 2000, 4000, 6000].map((offset) => (
        <Fragment key={`grid-offset-${offset}`}>
          {/* Vertical lines */}
          <div className="absolute top-[-8000px] h-[16000px] w-[1px] bg-ink/5" style={{ left: offset }} />
          <div className="absolute top-2 select-none text-[10px] font-medium text-ink/20" style={{ left: offset + 8 }}>
            ({offset},0)
          </div>
          {/* Horizontal lines */}
          <div className="absolute left-[-8000px] h-[1px] w-[16000px] bg-ink/5" style={{ top: offset }} />
          <div className="absolute left-2 select-none text-[10px] font-medium text-ink/20" style={{ top: offset + 8 }}>
            (0,{offset})
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function CanvasMiniMap({
  clusters,
  viewportX,
  viewportY,
  viewportScale,
  canvasRef
}: {
  clusters: PromptClusterItem[];
  viewportX: MotionValue<number>;
  viewportY: MotionValue<number>;
  viewportScale: MotionValue<number>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}) {
  const minimapRef = useRef<HTMLDivElement>(null);
  
  const bounds = useMemo(() => {
    if (!clusters.length) {
      return { minX: -800, minY: -600, width: 1600, height: 1200 };
    }

    const xs = clusters.flatMap((cluster) => [
      cluster.x - 180,
      cluster.x + 660,
      ...cluster.files.flatMap((file) => [cluster.x + file.x, cluster.x + file.x + 292])
    ]);
    const ys = clusters.flatMap((cluster) => [
      cluster.y - 220,
      cluster.y + 680,
      ...cluster.files.flatMap((file) => [cluster.y + file.y, cluster.y + file.y + 390])
    ]);
    const minX = Math.min(...xs) - 400;
    const minY = Math.min(...ys) - 300;
    const maxX = Math.max(...xs) + 400;
    const maxY = Math.max(...ys) + 300;
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }, [clusters]);

  const mapVx = useMotionValue(0);
  const mapVy = useMotionValue(0);
  const mapVw = useMotionValue(0);
  const mapVh = useMotionValue(0);

  const updateViewportRect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const scale = viewportScale.get() || 1;
    const vx = viewportX.get();
    const vy = viewportY.get();

    // World size
    const worldW = cw / scale;
    const worldH = ch / scale;
    const worldX = -vx / scale;
    const worldY = -vy / scale;

    mapVx.set(((worldX - bounds.minX) / bounds.width) * 100);
    mapVy.set(((worldY - bounds.minY) / bounds.height) * 100);
    mapVw.set((worldW / bounds.width) * 100);
    mapVh.set((worldH / bounds.height) * 100);
  }, [bounds, canvasRef, viewportScale, viewportX, viewportY, mapVx, mapVy, mapVw, mapVh]);

  useMotionValueEvent(viewportX, "change", updateViewportRect);
  useMotionValueEvent(viewportY, "change", updateViewportRect);
  useMotionValueEvent(viewportScale, "change", updateViewportRect);

  useEffect(() => {
    updateViewportRect();
    const observer = new ResizeObserver(() => updateViewportRect());
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [updateViewportRect, canvasRef]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    const minimap = minimapRef.current;
    if (!canvas || !minimap) return;

    const rect = minimap.getBoundingClientRect();
    
    // Jump viewport center to cursor location
    const jumpTo = (clientX: number, clientY: number) => {
      const ptrX = clientX - rect.left;
      const ptrY = clientY - rect.top;
      
      const pctX = ptrX / rect.width;
      const pctY = ptrY / rect.height;
      const worldCenterX = bounds.minX + pctX * bounds.width;
      const worldCenterY = bounds.minY + pctY * bounds.height;
      
      const scale = viewportScale.get();
      viewportX.set(canvas.clientWidth / 2 - (worldCenterX * scale));
      viewportY.set(canvas.clientHeight / 2 - (worldCenterY * scale));
    };

    jumpTo(e.clientX, e.clientY);

    const handlePointerMove = (moveEvent: PointerEvent) => jumpTo(moveEvent.clientX, moveEvent.clientY);
    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const rectLeft = useMotionTemplate`${mapVx}%`;
  const rectTop = useMotionTemplate`${mapVy}%`;
  const rectWidth = useMotionTemplate`${mapVw}%`;
  const rectHeight = useMotionTemplate`${mapVh}%`;

  return (
    <div
      data-canvas-interactive="true"
      className="pointer-events-auto absolute left-4 top-4 hidden h-28 w-44 overflow-hidden rounded-[var(--radius-md)] border border-line/30 bg-panel/85 p-1.5 shadow-elevated xl:block"
    >
      <div 
        ref={minimapRef}
        className="relative h-full w-full cursor-crosshair overflow-hidden rounded-lg bg-canvas/60"
        onPointerDown={handlePointerDown}
      >
        {clusters.map((cluster) => (
          <span
            key={cluster.id}
            className="absolute h-2.5 w-4 rounded-sm shadow-[0_0_16px_rgba(255,255,255,0.08)]"
            style={{
              left: `${((cluster.x - bounds.minX) / bounds.width) * 100}%`,
              top: `${((cluster.y - bounds.minY) / bounds.height) * 100}%`,
              backgroundColor: cluster.accent,
              opacity: cluster.status === "completed" ? 0.55 : 0.95
            }}
          />
        ))}

        {/* Viewport indicator */}
        <motion.div
          className="absolute rounded border border-brand/50 bg-brand/10"
          style={{
            left: rectLeft,
            top: rectTop,
            width: rectWidth,
            height: rectHeight,
          }}
        />
      </div>
    </div>
  );
}

export function PromptClusterCanvas() {
  const clusters = useWorkspaceStore((state) => state.prompts);
  const addPromptCluster = useWorkspaceStore((state) => state.addPromptCluster);
  const activeSessionId = useWorkspaceStore((state) => state.activeSessionId);
  const setActiveSession = useWorkspaceStore((state) => state.setActiveSession);
  const subscribeToBackendEvents = useWorkspaceStore((state) => state.subscribeToBackendEvents);
  const persistenceHydrated = useWorkspaceStore((state) => state.persistenceHydrated);
  const workspaceViewport = useWorkspaceStore((state) => state.workspaceViewport);
  const setViewportState = useWorkspaceStore((state) => state.setViewportState);
  const floatingFiles = useWorkspaceStore((state) => state.floatingFiles);
  const addFloatingFile = useWorkspaceStore((state) => state.addFloatingFile);
  const canvasBg = useWorkspaceStore((state) => state.canvasBg);
  const selectedModel = useWorkspaceStore((state) => state.selectedModel);
  const setSelectedModel = useWorkspaceStore((state) => state.setSelectedModel);
  const chatAttachments = useWorkspaceStore((state) => state.chatAttachments);
  const addChatAttachment = useWorkspaceStore((state) => state.addChatAttachment);
  const removeChatAttachment = useWorkspaceStore((state) => state.removeChatAttachment);
  const [draft, setDraft] = useState("");
  const [isPanning, setIsPanning] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [zoomLabel, setZoomLabel] = useState(Math.round(DEFAULT_ZOOM * 100));
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const restoredViewportRef = useRef(false);
  const panStateRef = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    velocityX: 0,
    velocityY: 0
  });

  const viewportX = useMotionValue(workspaceViewport.x);
  const viewportY = useMotionValue(workspaceViewport.y);
  const viewportScale = useMotionValue(workspaceViewport.zoom);
  const smoothX = useSpring(viewportX, { stiffness: 120, damping: 22, mass: 0.8 });
  const smoothY = useSpring(viewportY, { stiffness: 120, damping: 22, mass: 0.8 });
  const smoothScale = useSpring(viewportScale, { stiffness: 120, damping: 22, mass: 0.8 });
  const gridSize = useTransform(smoothScale, (latest) => Math.max(12, 30 * latest));
  const gridPosition = useMotionTemplate`${smoothX}px ${smoothY}px`;
  const gridBackgroundSize = useMotionTemplate`${gridSize}px ${gridSize}px`;
  const activeSession = useMemo(
    () => clusters.find((cluster) => cluster.id === activeSessionId) ?? null,
    [activeSessionId, clusters]
  );

  useEffect(() => {
    subscribeToBackendEvents();
  }, [subscribeToBackendEvents]);

  useEffect(() => {
    if (!persistenceHydrated || restoredViewportRef.current) {
      return;
    }
    restoredViewportRef.current = true;
    viewportX.set(workspaceViewport.x);
    viewportY.set(workspaceViewport.y);
    viewportScale.set(clamp(workspaceViewport.zoom, MIN_ZOOM, MAX_ZOOM));
  }, [persistenceHydrated, viewportScale, viewportX, viewportY, workspaceViewport]);

  useEffect(() => {
    let timer: number | null = null;
    const scheduleCommit = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => {
        timer = null;
        setViewportState({
          x: viewportX.get(),
          y: viewportY.get(),
          zoom: viewportScale.get()
        });
      }, 300);
    };

    const unsubscribeX = viewportX.on("change", scheduleCommit);
    const unsubscribeY = viewportY.on("change", scheduleCommit);
    const unsubscribeScale = viewportScale.on("change", scheduleCommit);

    return () => {
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      unsubscribeX();
      unsubscribeY();
      unsubscribeScale();
    };
  }, [setViewportState, viewportScale, viewportX, viewportY]);

  useMotionValueEvent(smoothScale, "change", (latest) => {
    setZoomLabel(Math.round(latest * 100));
  });

  const zoomAtPoint = useCallback(
    (nextScale: number, clientX?: number, clientY?: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) {
        viewportScale.set(nextScale);
        return;
      }

      const screenX = (clientX ?? rect.left + rect.width / 2) - rect.left;
      const screenY = (clientY ?? rect.top + rect.height / 2) - rect.top;
      const currentScale = viewportScale.get();
      const worldX = (screenX - viewportX.get()) / currentScale;
      const worldY = (screenY - viewportY.get()) / currentScale;
      const nextX = screenX - worldX * nextScale;
      const nextY = screenY - worldY * nextScale;

      viewportX.set(nextX);
      viewportY.set(nextY);
      viewportScale.set(nextScale);
    },
    [viewportScale, viewportX, viewportY]
  );

  const getViewportSpawn = useCallback((): PromptCanvasSpawn => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    const scale = viewportScale.get();
    return {
      x: (rect.width / 2 - viewportX.get()) / scale - 220,
      y: (rect.height / 2 - viewportY.get()) / scale - 240
    };
  }, [viewportScale, viewportX, viewportY]);

  const fitView = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !clusters.length) {
      zoomAtPoint(DEFAULT_ZOOM);
      return;
    }

    const minX = Math.min(
      ...clusters.flatMap((cluster) => [
        cluster.x,
        ...cluster.files.map((file) => cluster.x + file.x)
      ])
    );
    const maxX = Math.max(
      ...clusters.flatMap((cluster) => [
        cluster.x + 660,
        ...cluster.files.map((file) => cluster.x + file.x + 292)
      ])
    );
    const minY = Math.min(
      ...clusters.flatMap((cluster) => [
        cluster.y,
        ...cluster.files.map((file) => cluster.y + file.y)
      ])
    );
    const maxY = Math.max(
      ...clusters.flatMap((cluster) => [
        cluster.y + 680,
        ...cluster.files.map((file) => cluster.y + file.y + 390)
      ])
    );
    const width = maxX - minX;
    const height = maxY - minY;
    const nextScale = clamp(Math.min(rect.width / (width + 260), rect.height / (height + 220)), 0.34, 1.12);

    viewportScale.set(nextScale);
    viewportX.set(rect.width / 2 - (minX + width / 2) * nextScale);
    viewportY.set(rect.height / 2 - (minY + height / 2) * nextScale);
  }, [clusters, viewportScale, viewportX, viewportY, zoomAtPoint]);

  const submitDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextPrompt = draft.trim();
    if (!nextPrompt) {
      return;
    }

    void addPromptCluster(nextPrompt, getViewportSpawn());
    setDraft("");
  };

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const content = isImage ? result.split(",")[1] ?? "" : result;
        const attachment: ChatAttachment = {
          id: `attach-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          type: isImage ? "image" : "file",
          mimeType: file.type || "text/plain",
          content,
          size: file.size
        };
        addChatAttachment(attachment);
      };
      if (isImage) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
    event.target.value = "";
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-canvas-interactive='true']")) {
      return;
    }

    event.preventDefault();
    const delta = clamp(event.deltaY, -260, 260);
    const nextScale = clamp(viewportScale.get() * Math.exp(-delta * 0.0017), MIN_ZOOM, MAX_ZOOM);
    zoomAtPoint(nextScale, event.clientX, event.clientY);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-canvas-interactive='true']")) {
      return;
    }

    setActiveSession(null);
    event.currentTarget.setPointerCapture(event.pointerId);
    panStateRef.current = {
      active: true,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocityX: 0,
      velocityY: 0
    };
    setIsPanning(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const panState = panStateRef.current;
    if (!panState.active) {
      return;
    }

    const now = performance.now();
    const elapsed = Math.max(8, now - panState.lastTime);
    const dx = event.clientX - panState.lastX;
    const dy = event.clientY - panState.lastY;

    viewportX.set(viewportX.get() + dx);
    viewportY.set(viewportY.get() + dy);
    panStateRef.current = {
      active: true,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: now,
      velocityX: (dx / elapsed) * 1000,
      velocityY: (dy / elapsed) * 1000
    };
  };

  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const panState = panStateRef.current;
    if (!panState.active) {
      return;
    }

    panStateRef.current.active = false;
    setIsPanning(false);

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture can already be released if the window loses focus during a drag.
    }

    const velocityX = clamp(panState.velocityX, -1800, 1800);
    const velocityY = clamp(panState.velocityY, -1800, 1800);
    viewportX.set(viewportX.get() + velocityX * 0.18);
    viewportY.set(viewportY.get() + velocityY * 0.18);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("application/x-floating-file-path")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    const filePath = e.dataTransfer.getData("application/x-floating-file-path");
    if (!filePath) return;
    e.preventDefault();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scale = viewportScale.get();
    const worldX = (e.clientX - rect.left - viewportX.get()) / scale;
    const worldY = (e.clientY - rect.top - viewportY.get()) / scale;

    void addFloatingFile(filePath, Math.round(worldX - 240), Math.round(worldY - 20));
  };

  return (
    <div
      ref={canvasRef}
      className={`relative h-full w-full overflow-hidden ${canvasBg === "dot-grid" ? "bg-canvas" : ""} ${isPanning ? "cursor-grabbing" : "cursor-grab"} ${isDragOver ? "ring-2 ring-inset ring-brand/40" : ""}`}
      style={canvasBg === "circuit-trace" ? { backgroundColor: "#0a0c10" } : canvasBg === "topographic" ? { backgroundColor: "#0c0e0f" } : undefined}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <TextSelectionPopover 
        onReference={(text) => {
          setDraft((prev) => (prev ? `${prev.trim()}\n> ${text}\n` : `> ${text}\n`));
          // Provide focus to textarea
          const tae = document.querySelector("textarea[placeholder*='session']") as HTMLTextAreaElement;
          tae?.focus();
        }} 
      />

      {canvasBg === "dot-grid" && (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage: "radial-gradient(circle, rgb(var(--color-ink-rgb) / 0.08) 1px, transparent 1.2px)",
            backgroundPosition: gridPosition,
            backgroundSize: gridBackgroundSize
          }}
        />
      )}
      {canvasBg === "circuit-trace" && (
        <CircuitTraceBackground viewportX={smoothX} viewportY={smoothY} />
      )}
      {canvasBg === "topographic" && (
        <TopographicBackground viewportX={smoothX} viewportY={smoothY} />
      )}

      <motion.div
        className="absolute left-0 top-0 h-px w-px origin-top-left will-change-transform"
        style={{ x: smoothX, y: smoothY, scale: smoothScale }}
      >
        <CanvasOriginMarkings />
        <AnimatePresence initial={false}>
          {clusters.map((cluster) => (
            <PromptCluster
              key={cluster.id}
              cluster={cluster}
              canvasScale={zoomLabel / 100}
            />
          ))}
        </AnimatePresence>
        {floatingFiles.map((file) => (
          <FloatingFileWindow
            key={file.id}
            file={file}
            canvasScale={zoomLabel / 100}
          />
        ))}
      </motion.div>

      <div
        data-canvas-interactive="true"
        className="pointer-events-auto absolute right-4 top-4 flex items-center gap-0.5 rounded-[var(--radius-md)] border border-line/40 bg-panel/90 p-1 shadow-elevated"
      >
        <button
          className="iconButton"
          type="button"
          title="Zoom out"
          onClick={() => zoomAtPoint(clamp(viewportScale.get() / 1.22, MIN_ZOOM, MAX_ZOOM))}
        >
          <Minus size={14} />
        </button>
        <div className="w-12 text-center text-[11px] font-semibold text-muted">{zoomLabel}%</div>
        <button
          className="iconButton"
          type="button"
          title="Zoom in"
          onClick={() => zoomAtPoint(clamp(viewportScale.get() * 1.22, MIN_ZOOM, MAX_ZOOM))}
        >
          <Plus size={14} />
        </button>
        <button className="iconButton" type="button" title="Fit canvas" onClick={fitView}>
          <LocateFixed size={14} />
        </button>
      </div>

      <CanvasMiniMap 
        clusters={clusters} 
        viewportX={viewportX}
        viewportY={viewportY}
        viewportScale={viewportScale}
        canvasRef={canvasRef}
      />

      <form
        data-canvas-interactive="true"
        className="pointer-events-auto absolute bottom-4 left-1/2 w-[min(720px,calc(100%-48px))] -translate-x-1/2 rounded-[var(--radius-lg)] border border-line/40 bg-panel/92 p-2.5 shadow-card backdrop-blur-sm"
        onSubmit={submitDraft}
        onWheel={(event) => event.stopPropagation()}
      >
        <div className="mb-1.5 flex items-center justify-between gap-3 px-1">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">
              {activeSession ? (
                <span className="inline-flex min-w-0 items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span className="truncate">Sending to {activeSession.title}</span>
                </span>
              ) : (
                <span>New session</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-1.5 rounded-md border border-line/70 bg-surface/70 px-2.5 py-1.5 text-[13px] text-muted transition hover:border-brand/45 hover:text-ink"
              >
                {GEMINI_MODELS.find((m) => m.id === selectedModel)?.label ?? selectedModel}
                <ChevronDown size={12} />
              </button>
              {modelDropdownOpen && (
                <div className="absolute bottom-full right-0 mb-1 z-50 min-w-[180px] rounded-lg border border-line/80 bg-panel p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                  {GEMINI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => { setSelectedModel(model.id); setModelDropdownOpen(false); }}
                      className={`flex w-full items-center rounded-md px-3 py-2 text-left text-[13px] transition ${
                        selectedModel === model.id
                          ? "bg-brand/15 text-brand"
                          : "text-muted hover:bg-surface hover:text-ink"
                      }`}
                    >
                      {model.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {clusters.length === 0 ? (
              <div className="flex flex-wrap justify-end gap-1.5">
                {suggestionPrompts.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-full border border-line/70 bg-surface/70 px-2.5 py-1 text-[11px] text-muted transition hover:border-brand/45 hover:text-ink"
                    onClick={() => setDraft(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Attachment previews */}
        {chatAttachments.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1.5 px-1">
            {chatAttachments.map((attachment) => (
              <span key={attachment.id} className="inline-flex items-center gap-1.5 rounded-md border border-line/70 bg-surface/60 px-2.5 py-1.5 text-[13px] text-muted">
                {attachment.type === "image" ? <Image size={11} /> : <Paperclip size={11} />}
                <span className="max-w-[120px] truncate">{attachment.name}</span>
                <button
                  type="button"
                  onClick={() => removeChatAttachment(attachment.id)}
                  className="grid h-4 w-4 place-items-center rounded hover:bg-white/[0.08] hover:text-ink"
                >
                  <X size={9} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Attach file button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface hover:text-ink"
            title="Attach file or image"
          >
            <Paperclip size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.ts,.tsx,.js,.jsx,.py,.json,.md,.css,.html,.rs,.go,.java,.c,.cpp,.h,.yaml,.yml,.toml,.xml,.sql,.sh,.env"
            onChange={handleFileAttach}
            className="hidden"
          />

          <label className="min-w-0 flex-1">
            <span className="sr-only">Prompt</span>
            <textarea
              className="max-h-36 min-h-11 w-full resize-none bg-transparent px-1.5 py-2 text-[15px] leading-6 text-ink outline-none placeholder:text-muted/60"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={activeSession ? "Continue the selected session..." : "Start a new AI session..."}
              rows={1}
            />
          </label>
          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-canvas shadow-soft transition hover:brightness-110 disabled:opacity-45"
            type="submit"
            disabled={!draft.trim()}
            title={activeSession ? "Send to selected session" : "Start session"}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
