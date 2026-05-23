import { motion } from "framer-motion";
import { Check, Clock3, FolderTree, RefreshCw, Search, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FileTreeNode, WorkspaceTab } from "../../../shared/ide";
import type { CanvasBgKind } from "../../stores/workspaceStore";
import { selectThemePalette, selectThemeProfiles, useWorkspaceStore } from "../../stores/workspaceStore";
import { CircuitTracePreview, DotGridPreview, TopographicPreview } from "./CanvasBackgrounds";
import { FileTree } from "./FileTree";

const tabs: Array<{ id: WorkspaceTab; label: string; icon: LucideIcon }> = [
  { id: "explorer", label: "Files", icon: FolderTree },
  { id: "history", label: "Git", icon: Clock3 },
  { id: "settings", label: "Settings", icon: Settings }
];

function collectMatchingFiles(node: FileTreeNode | null, query: string): FileTreeNode[] {
  if (!node || !query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase();
  const matches: FileTreeNode[] = [];
  const visit = (current: FileTreeNode): void => {
    if (
      current.type === "file" &&
      (current.name.toLowerCase().includes(normalizedQuery) ||
        current.path.toLowerCase().includes(normalizedQuery))
    ) {
      matches.push(current);
    }
    current.children?.forEach(visit);
  };

  visit(node);
  return matches.slice(0, 80);
}

export function LeftSidebar() {
  const tree = useWorkspaceStore((state) => state.tree);
  const leftTab = useWorkspaceStore((state) => state.leftTab);
  const fileSearch = useWorkspaceStore((state) => state.fileSearch);
  const setFileSearch = useWorkspaceStore((state) => state.setFileSearch);
  const setLeftTab = useWorkspaceStore((state) => state.setLeftTab);
  const openFolder = useWorkspaceStore((state) => state.openFolder);
  const refreshTree = useWorkspaceStore((state) => state.refreshTree);
  const openFile = useWorkspaceStore((state) => state.openFile);
  const themeProfileId = useWorkspaceStore((state) => state.themeProfileId);
  const customThemeColors = useWorkspaceStore((state) => state.customThemeColors);
  const setThemeProfile = useWorkspaceStore((state) => state.setThemeProfile);
  const setCustomThemeColor = useWorkspaceStore((state) => state.setCustomThemeColor);
  const resetCustomThemeColors = useWorkspaceStore((state) => state.resetCustomThemeColors);
  const canvasBg = useWorkspaceStore((state) => state.canvasBg);
  const setCanvasBg = useWorkspaceStore((state) => state.setCanvasBg);
  const activePalette = useWorkspaceStore(selectThemePalette);
  const themeProfiles = selectThemeProfiles();
  const matches = collectMatchingFiles(tree, fileSearch);

  return (
    <aside className="flex h-full min-h-0 min-w-[220px] flex-col bg-panel/60">
      <nav className="grid grid-cols-3 gap-1 border-b border-line/40 p-1.5" aria-label="Workspace navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              className={`sidebarTab ${leftTab === tab.id ? "sidebarTabActive" : ""}`}
              key={tab.id}
              type="button"
              onClick={() => setLeftTab(tab.id)}
              title={tab.label}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {leftTab === "explorer" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-2 border-b border-line/40 p-2.5">
            <div className="flex gap-1.5">
              <button className="primarySmallButton flex-1" type="button" onClick={openFolder}>
                Open Folder
              </button>
              <button className="iconButton" type="button" onClick={refreshTree} title="Refresh files">
                <RefreshCw size={14} />
              </button>
            </div>
            <label className="flex h-8 items-center gap-2 rounded-[var(--radius-sm)] border border-line/50 bg-canvas/50 px-2.5 text-[12px] text-muted">
              <Search size={13} />
              <input
                className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-muted/60"
                value={fileSearch}
                onChange={(event) => setFileSearch(event.target.value)}
                placeholder="Search files"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-2.5">
            {tree ? (
              fileSearch.trim() ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                  {matches.map((file) => (
                    <button
                      className="fileSearchResult"
                      key={file.path}
                      type="button"
                      onClick={() => void openFile(file.path)}
                    >
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="truncate text-xs text-muted">{file.path}</span>
                    </button>
                  ))}
                  {matches.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-muted">No matching files</p>
                  ) : null}
                </motion.div>
              ) : (
                <FileTree node={tree} depth={0} />
              )
            ) : (
              <div className="grid h-full place-items-center px-6 text-center">
                <div>
                  <FolderTree className="mx-auto mb-3 text-muted" size={28} />
                  <p className="text-sm font-semibold">No folder open</p>
                  <p className="mt-1 text-sm text-muted">Choose a local project to explore and edit files.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {leftTab === "history" ? (
        <div className="space-y-3 p-4">
          <h2 className="text-sm font-semibold">Git & History</h2>
          <div className="rounded-lg border border-dashed border-line/80 bg-surface/60 p-4 text-sm text-muted">
            Git status and file history will live here. This is UI-only for now.
          </div>
        </div>
      ) : null}

      {leftTab === "settings" ? (
        <div className="space-y-3 p-4">
          <h2 className="text-sm font-semibold">Settings</h2>
          <div className="space-y-2 rounded-lg border border-line/80 bg-surface/70 p-3 text-sm shadow-sm">
            <div className="flex items-center justify-between">
              <span>Theme</span>
              <span className="text-muted">{themeProfiles.find((profile) => profile.id === themeProfileId)?.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>AI features</span>
              <span className="text-muted">Off</span>
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-line/80 bg-surface/70 p-3 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Theme Profiles</h3>
            <div className="grid grid-cols-2 gap-2">
              {themeProfiles.map((profile) => (
                <button
                  className={`rounded-md border px-2 py-1.5 text-left text-xs transition ${
                    themeProfileId === profile.id
                      ? "border-brand bg-brand/15 text-ink"
                      : "border-line/80 bg-panel/70 text-muted hover:bg-surface hover:text-ink"
                  }`}
                  key={profile.id}
                  type="button"
                  onClick={() => setThemeProfile(profile.id)}
                >
                  {profile.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-line/80 bg-surface/70 p-3 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Canvas background</h3>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "dot-grid" as CanvasBgKind, label: "Dot grid", desc: "Classic infinite canvas", Preview: DotGridPreview },
                { id: "circuit-trace" as CanvasBgKind, label: "Circuit trace", desc: "PCB-inspired, thematic", Preview: CircuitTracePreview },
                { id: "topographic" as CanvasBgKind, label: "Topographic", desc: "Contour lines, calm depth", Preview: TopographicPreview }
              ]).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCanvasBg(opt.id)}
                  className="group relative flex flex-col gap-1"
                >
                  <div className={`relative aspect-[3/2] w-full overflow-hidden rounded-[8px] transition ${
                    canvasBg === opt.id
                      ? "border-2 border-[#534AB7]"
                      : "border border-white/[0.08] hover:border-white/[0.16]"
                  }`}>
                    <opt.Preview />
                    {canvasBg === opt.id && (
                      <span className="absolute right-1 top-1 grid h-[16px] w-[16px] place-items-center rounded-full bg-[#534AB7]">
                        <Check size={8} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] leading-tight text-zinc-400 group-hover:text-zinc-200">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 rounded-lg border border-line/80 bg-surface/70 p-3 shadow-sm">
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Custom Colors</h3>
              {Object.keys(customThemeColors).length > 0 && (
                <button
                  type="button"
                  className="text-[10px] text-brand hover:underline"
                  onClick={() => resetCustomThemeColors()}
                >
                  Reset
                </button>
              )}
            </div>
            <p className="text-xs text-muted leading-relaxed">Customize any token. Selecting a Custom Color automatically engages the Custom Theme.</p>
            <div className="flex flex-col gap-2 mt-2">
            {(
              [
                ["canvas", "Background (Canvas)"],
                ["panel", "Sidebar / Panel"],
                ["surface", "Surface / Hover"],
                ["line", "Borders (Line)"],
                ["ink", "Main Text (Ink)"],
                ["muted", "Muted Text"],
                ["brand", "Brand Elements"],
                ["accent", "Accent / Action"],
                ["terminal", "Terminal BG"],
                ["terminalText", "Terminal Text"],
                ["terminalSelection", "Terminal Select"]
              ] as const
            ).map(([key, label]) => {
              const hexValue = activePalette?.[key] ?? "#000000";
              return (
              <label className="flex items-center justify-between gap-3 text-xs" key={key}>
                <span className="truncate" title={label}>{label}</span>
                <div className="flex items-center gap-2">
                  <input
                    className="h-7 w-10 shrink-0 cursor-pointer rounded border border-line bg-panel p-0 hover:border-brand"
                    type="color"
                    value={hexValue}
                    onChange={(event) => setCustomThemeColor(key, event.target.value)}
                  />
                  <span className="w-[66px] shrink-0 text-right font-mono text-[10px] text-muted uppercase">{hexValue}</span>
                </div>
              </label>
              );
            })}
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
