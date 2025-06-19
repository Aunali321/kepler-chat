'use client';

import { useEffect, useRef, memo } from 'react';
import { MessageRenderer } from './message-renderer';
import type { Message } from 'ai';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export const MessageList = memo(function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
          <p className="text-muted-foreground">
            Send a message to begin chatting with AI
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollAreaRef}
      className="flex-1 overflow-y-auto p-4 space-y-6"
    >
      {messages.map((message, index) => (
        <MessageRenderer
          key={message.id || `${message.role}-${index}`}
          message={message}
          isLast={index === messages.length - 1}
        />
      ))}
      
      {/* Invisible element for auto-scrolling */}
      <div ref={messagesEndRef} className="h-0" />
    </div>
  );
});