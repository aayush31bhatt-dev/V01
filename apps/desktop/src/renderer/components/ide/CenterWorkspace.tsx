import { useWorkspaceStore } from "../../stores/workspaceStore";
import { PromptClusterCanvas } from "./PromptClusterCanvas";
import { SessionDetailPanel } from "./SessionDetailPanel";

export function CenterWorkspace() {
  const expandedSessionId = useWorkspaceStore((s) => s.expandedSessionId);

  return (
    <section className="relative flex min-h-0 flex-1 overflow-hidden bg-[var(--workspace-middle)]">
      {expandedSessionId ? <SessionDetailPanel /> : <PromptClusterCanvas />}
    </section>
  );
}
