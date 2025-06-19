"use client";

import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import { memo } from "react";
import type { Message } from "ai";
import type { Message as DBMessage } from "@/lib/db/types";
import { TextMessage } from "./text-message";
import { MultipartMessage } from "./multipart-message";
import { MessageAttachments } from "./message-attachments";
import { ToolInvocations } from "./tool-invocations";
import { MessageActions } from "./message-actions";

interface MessageRendererProps {
  message: Message | DBMessage;
  isLast?: boolean;
  isSharedView?: boolean;
  canEdit?: boolean;
}

export const MessageRenderer = memo(function MessageRenderer({
  message,
  isLast = false,
  isSharedView = false,
  canEdit = false,
}: MessageRendererProps) {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";

  const renderContent = () => {
    const content = message.content;

    if (typeof content === "string") {
      return <TextMessage content={content} />;
    }

    if (Array.isArray(content)) {
      return <MultipartMessage content={content} />;
    }

    return null;
  };

  return (
    <div className="group relative">
      <div
        className={cn(
          "flex items-start gap-3 max-w-4xl",
          isUser ? "ml-auto flex-row-reverse" : ""
        )}
      >
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Content */}
        <div
          className={cn(
            "rounded-lg p-3 max-w-[85%] break-words",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50",
            isSystem && "bg-amber-50 text-amber-900 border border-amber-200"
          )}
        >
          {renderContent()}
        </div>

        <MessageActions
          content={message.content}
          isUser={isUser}
          isSharedView={isSharedView}
          canEdit={canEdit}
        />

        {(message as any).experimental_attachments &&
          Array.isArray((message as any).experimental_attachments) &&
          (message as any).experimental_attachments.length > 0 && (
            <MessageAttachments
              attachments={(message as any).experimental_attachments}
            />
          )}

        {message.toolInvocations &&
          Array.isArray(message.toolInvocations) &&
          message.toolInvocations.length > 0 && (
            <ToolInvocations toolInvocations={message.toolInvocations} />
          )}
      </div>
    </div>
  );
});