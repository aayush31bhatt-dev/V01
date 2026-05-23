import { useState, type DragEvent } from "react";
import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import type { FileTreeNode } from "../../../shared/ide";
import { useWorkspaceStore } from "../../stores/workspaceStore";

interface FileTreeProps {
  node: FileTreeNode;
  depth: number;
}

export function FileTree({ node, depth }: FileTreeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const openFile = useWorkspaceStore((state) => state.openFile);
  const activeFilePath = useWorkspaceStore((state) => state.activeFilePath);
  const isDirectory = node.type === "directory";
  const isActive = activeFilePath === node.path;

  const handleDragStart = (e: DragEvent<HTMLButtonElement>) => {
    if (isDirectory) return;
    e.dataTransfer.setData("application/x-floating-file-path", node.path);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div>
      <button
        className={`fileTreeRow ${isActive ? "fileTreeRowActive" : ""}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        type="button"
        draggable={!isDirectory}
        onDragStart={handleDragStart}
        onClick={() => {
          if (isDirectory) {
            setExpanded((value) => !value);
          } else {
            void openFile(node.path);
          }
        }}
        title={node.path}
      >
        {isDirectory ? (
          <ChevronRight className={expanded ? "rotate-90 transition" : "transition"} size={14} />
        ) : (
          <span className="w-3.5" />
        )}
        {isDirectory ? expanded ? <FolderOpen size={15} /> : <Folder size={15} /> : <File size={15} />}
        <span className="truncate">{node.name}</span>
      </button>

      {isDirectory && expanded && node.children?.length ? (
        <div>
          {node.children.map((child) => (
            <FileTree key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
