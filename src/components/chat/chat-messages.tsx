"use client";

import { MessageList } from "./message-list";
import { LoadingIndicator } from "./loading-indicator";
import { ApiErrorBoundary } from "@/components/ui/api-error-boundary";
import { useChatContext } from "@/context/chat-context";

export function ChatMessages() {
  const { messages, isLoading, error, reload, stop } = useChatContext();

  return (
    <>
      {/* Messages */}
      <ApiErrorBoundary maxRetries={3}>
        <div className="flex-1 overflow-y-auto">
          <MessageList messages={messages} isLoading={isLoading} />
        </div>
      </ApiErrorBoundary>

      {/* Loading indicator */}
      {isLoading && (
        <div className="px-4 py-2 border-t">
          <LoadingIndicator onStop={stop} />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-600 text-sm">
          <div className="flex items-center justify-between">
            <span>Error: {error.message}</span>
            <button
              onClick={() => reload()}
              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </>
  );
}