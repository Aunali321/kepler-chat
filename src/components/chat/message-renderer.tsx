"use client";

import { cn } from "@/lib/utils";
import { User, Bot, Copy, Check, FileText, Music, Video } from "lucide-react";
import { useState } from "react";
import type { Message } from "ai";
import type { Message as DBMessage } from "@/lib/db/types";

interface MessageRendererProps {
  message: Message | DBMessage;
  isLast?: boolean;
  isSharedView?: boolean;
  canEdit?: boolean;
}

export function MessageRenderer({
  message,
  isLast = false,
  isSharedView = false,
  canEdit = false,
}: MessageRendererProps) {
  const [copied, setCopied] = useState(false);

  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";

  const handleCopy = async () => {
    if (typeof message.content === "string") {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle different content types
  const renderContent = () => {
    const content = message.content;

    if (typeof content === "string") {
      return (
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap break-words">{content}</div>
        </div>
      );
    }

    // Handle multi-part content (e.g., with images)
    if (Array.isArray(content)) {
      const contentArray = content as any[];
      return (
        <div className="space-y-2">
          {contentArray.map((part: any, index: number) => (
            <div key={index}>
              {part.type === "text" && (
                <div className="whitespace-pre-wrap break-words">
                  {part.text}
                </div>
              )}
              {part.type === "image" && (
                <img
                  src={part.image}
                  alt="Attached image"
                  className="max-w-sm rounded-lg border"
                />
              )}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  // Don't render system messages visually
  if (isSystem) {
    return null;
  }

  // Shared view uses simpler layout
  if (isSharedView) {
    return (
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium capitalize">{message.role}</span>
          <span className="text-xs text-gray-500">
            {/* Handle both AI SDK messages and DB messages */}
            {message.createdAt && new Date(message.createdAt).toLocaleString()}
          </span>
        </div>
        {message.content && (
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        )}

        {/* Copy button for shared view */}
        <div className="flex justify-end mt-2">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
            title="Copy message"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 text-gray-500" />
            )}
          </button>
        </div>
      </div>
    );
  }

  // Regular chat view
  return (
    <div className={cn("flex gap-3 group", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message content */}
      <div className={cn("flex-1 min-w-0", isUser && "text-right")}>
        {/* Message bubble */}
        <div
          className={cn(
            "inline-block max-w-[80%] p-3 rounded-lg",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground border"
          )}
        >
          {renderContent()}
        </div>

        {/* Actions */}
        <div
          className={cn(
            "flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-accent/20 transition-colors"
            title="Copy message"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Experimental attachments */}
        {(message as any).experimental_attachments &&
          Array.isArray((message as any).experimental_attachments) &&
          (message as any).experimental_attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {(message as any).experimental_attachments
                .filter(
                  (attachment: any) =>
                    attachment?.contentType?.startsWith("image/") ||
                    attachment?.contentType?.startsWith("application/pdf") ||
                    attachment?.contentType?.startsWith("audio/") ||
                    attachment?.contentType?.startsWith("video/") ||
                    attachment?.contentType?.startsWith("text/")
                )
                .map((attachment: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    {attachment.contentType?.startsWith("image/") && (
                      <img
                        src={attachment.url}
                        alt={attachment.name || "Attached image"}
                        className="max-w-sm rounded-lg"
                      />
                    )}
                    {attachment.contentType === "application/pdf" && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium">
                          {attachment.name}
                        </span>
                      </div>
                    )}
                    {attachment.contentType?.startsWith("audio/") && (
                      <div className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium">
                          {attachment.name}
                        </span>
                      </div>
                    )}
                    {attachment.contentType?.startsWith("video/") && (
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">
                          {attachment.name}
                        </span>
                      </div>
                    )}
                    {attachment.contentType?.startsWith("text/") && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">
                          {attachment.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

        {/* Tool invocations */}
        {message.toolInvocations &&
          Array.isArray(message.toolInvocations) &&
          message.toolInvocations.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.toolInvocations.map(
                (toolInvocation: any, index: number) => {
                  const getToolIcon = (toolName: string) => {
                    const icons: Record<string, string> = {
                      calculator: "🧮",
                      weather: "🌤️",
                      webSearch: "🔍",
                      codeExecutor: "💻",
                      urlFetch: "🌐",
                    };
                    return icons[toolName] || "🔧";
                  };

                  const isCompleted =
                    toolInvocation.state === "result" || toolInvocation.result;
                  const isRunning =
                    toolInvocation.state === "call" && !toolInvocation.result;

                  return (
                    <div
                      key={index}
                      className={cn(
                        "border rounded-lg p-3 text-sm",
                        isCompleted
                          ? "bg-primary/10 border-primary/20"
                          : "bg-secondary/50 border-secondary/80"
                      )}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        {isRunning && (
                          <div className="w-3 h-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        )}
                        <span>{getToolIcon(toolInvocation.toolName)}</span>
                        <span className="capitalize">
                          {toolInvocation.toolName
                            ?.replace(/([A-Z])/g, " $1")
                            .trim() || "Tool"}
                        </span>
                        {isCompleted && (
                          <span className="text-primary text-xs">
                            ✓ Completed
                          </span>
                        )}
                        {isRunning && (
                          <span className="text-secondary-foreground text-xs">
                            Running...
                          </span>
                        )}
                      </div>

                      {toolInvocation.args && (
                        <div className="mt-2 text-gray-600">
                          <pre className="text-xs bg-gray-900 text-white p-2 rounded">
                            <code>
                              {JSON.stringify(toolInvocation.args, null, 2)}
                            </code>
                          </pre>
                        </div>
                      )}

                      {toolInvocation.result && (
                        <div className="mt-2 text-gray-600">
                          <pre className="text-xs bg-gray-900 text-white p-2 rounded">
                            <code>
                              {JSON.stringify(toolInvocation.result, null, 2)}
                            </code>
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
      </div>
    </div>
  );
}
