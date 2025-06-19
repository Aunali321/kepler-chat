"use client";

import { ChatInput } from "./chat-input";
import { useChatContext } from "@/context/chat-context";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings } from "lucide-react";

export function ChatInputWrapper() {
  const {
    chatId,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    selectedProvider,
    selectedModel,
    openSettingsDialog,
  } = useChatContext();

  const [showModelError, setShowModelError] = useState(false);

  // Enhanced handleSubmit with model validation
  const handleValidatedSubmit = (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: any[] }
  ) => {
    // Check if provider and model are selected
    if (!selectedProvider || !selectedModel) {
      setShowModelError(true);
      e.preventDefault();
      return;
    }

    // Clear any previous error
    setShowModelError(false);

    // Convert experimental_attachments to data format for context
    const chatRequestOptions = options?.experimental_attachments
      ? { data: { experimental_attachments: options.experimental_attachments } }
      : undefined;

    // Proceed with normal submission
    handleSubmit(e, chatRequestOptions);
  };

  return (
    <div className="border-t p-4 bg-background/95 backdrop-blur space-y-3">
      {/* Model selection error */}
      {showModelError && (
        <Alert className="border-amber-200 bg-amber-50">
          <Settings className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Please select an AI model before sending a message.</span>
            <button
              onClick={() => {
                openSettingsDialog();
                setShowModelError(false);
              }}
              className="text-amber-700 hover:text-amber-900 underline ml-2"
            >
              Choose Model
            </button>
          </AlertDescription>
        </Alert>
      )}

      <ChatInput
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleValidatedSubmit}
        isLoading={isLoading}
        onStop={stop}
        chatId={chatId || undefined}
      />
    </div>
  );
}
