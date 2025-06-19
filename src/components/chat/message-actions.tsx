"use client";

import { useState, useCallback, memo } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  content: string | any[];
  isUser: boolean;
  isSharedView: boolean;
  canEdit: boolean;
}

export const MessageActions = memo(function MessageActions({
  content,
  isUser,
  isSharedView,
  canEdit,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (typeof content === "string") {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 mt-1 transition-opacity",
        isUser ? "justify-end" : "justify-start",
        isSharedView ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}
    >
      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-accent/20 transition-colors"
        title="Copy message"
        disabled={isSharedView && !canEdit}
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-500" />
        ) : (
          <Copy className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
    </div>
  );
});