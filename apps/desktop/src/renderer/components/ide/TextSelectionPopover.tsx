import { Quote } from "lucide-react";
import { useEffect, useState } from "react";

export function TextSelectionPopover({ onReference }: { onReference?: (text: string) => void }) {
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState("");

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
        // Need to check if we are in a chat message or where selection is allowed
        const range = selection.getRangeAt(0);
        const node = range.commonAncestorContainer;
        const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
        
        // Only show if the selection is inside the canvas/prompt clusters
        if (!element?.closest("[data-canvas-interactive='true']")) {
          setSelectionPos(null);
          return;
        }

        const rect = range.getBoundingClientRect();
        
        // Show popover slightly above the selection
        setSelectionPos({
          x: rect.left + rect.width / 2,
          y: rect.top - 8,
        });
        setSelectedText(selection.toString());
      } else {
        setSelectionPos(null);
      }
    };

    // Listen to selection changes
    document.addEventListener("selectionchange", handleSelection);
    return () => {
      document.removeEventListener("selectionchange", handleSelection);
    };
  }, []);

  if (!selectionPos) return null;

  return (
    <div
      className="fixed z-50 flex -translate-x-1/2 -translate-y-full cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-[#1e1e1e] px-3 py-1.5 text-[12px] font-medium text-white shadow-xl transition hover:bg-[#252525]"
      style={{ left: selectionPos.x, top: selectionPos.y }}
      onPointerDown={(e) => {
        // Prevent clearing selection
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (onReference) {
          onReference(selectedText);
        }
        
        // Let's clear the selection after action
        window.getSelection()?.removeAllRanges();
      }}
    >
      <Quote size={12} className="fill-current text-zinc-300" />
      <span className="text-zinc-200">Reference in chat</span>
    </div>
  );
}
