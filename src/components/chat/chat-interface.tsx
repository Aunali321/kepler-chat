"use client";

import { ChatProvider } from "@/context/chat-context";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInputWrapper } from "./chat-input-wrapper";
import { ChatModals } from "./chat-modals";
import { ApiErrorBoundary } from "@/components/ui/api-error-boundary";

interface ChatInterfaceProps {
  chatId?: string;
  initialMessages?: any[];
  chatTitle?: string;
}

export function ChatInterface({
  chatId,
  initialMessages = [],
  chatTitle,
}: ChatInterfaceProps) {

  return (
    <ApiErrorBoundary maxRetries={3}>
      <ChatProvider 
        chatId={chatId} 
        initialMessages={initialMessages}
        chatTitle={chatTitle}
      >
        <div className="flex flex-col h-full max-h-screen">
          <ChatHeader chatTitle={chatTitle} />
          <ChatMessages />
          <ChatInputWrapper />
          <ChatModals chatTitle={chatTitle} />
        </div>
      </ChatProvider>
    </ApiErrorBoundary>
  );
}
