"use client";

import { ChatInput } from "./chat-input";
import { useChatContext } from "@/context/chat-context";

export function ChatInputWrapper() {
  const {
    chatId,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
  } = useChatContext();

  return (
    <div className="border-t p-4 bg-background/95 backdrop-blur">
      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        onStop={stop}
        chatId={chatId}
      />
    </div>
  );
}