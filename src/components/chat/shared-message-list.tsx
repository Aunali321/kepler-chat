"use client";

import { MessageRenderer } from "./message-renderer";
import { type Message } from "ai/react";

interface SharedMessageListProps {
  messages: Message[];
  isOwner: boolean;
}

export function SharedMessageList({
  messages,
  isOwner,
}: SharedMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {messages.map((message) => (
            <MessageRenderer
              key={message.id}
              message={message}
              isSharedView={true}
              canEdit={isOwner}
            />
          ))}
        </div>
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            This chat doesn't have any messages yet.
          </div>
        )}
      </div>
    </div>
  );
}
