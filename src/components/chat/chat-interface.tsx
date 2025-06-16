'use client';

import { useChat } from 'ai/react';
import { useState, useEffect } from 'react';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { ProviderSelector } from './provider-selector';
import { ToolSelector } from './tool-selector';
import { LoadingIndicator } from './loading-indicator';
import { providers, type ProviderKey } from '@/lib/providers';
import { defaultTools, type ToolName } from '@/lib/tools';

interface ChatInterfaceProps {
  chatId?: string;
  initialMessages?: any[];
}

export function ChatInterface({ chatId, initialMessages = [] }: ChatInterfaceProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey>('google');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [enabledTools, setEnabledTools] = useState<ToolName[]>(defaultTools);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setMessages,
  } = useChat({
    api: '/api/chat',
    body: {
      chatId,
      provider: selectedProvider,
      model: selectedModel,
      systemPrompt,
      enabledTools,
    },
    initialMessages,
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: (message, { usage, finishReason }) => {
      console.log('Message finished:', { usage, finishReason });
    },
  });

  // Update system prompt when provider/model changes
  useEffect(() => {
    // You could implement different default system prompts per provider here
  }, [selectedProvider, selectedModel]);

  const handleProviderChange = (provider: ProviderKey, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header with provider selector */}
      <div className="border-b p-4 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            {chatId ? 'Chat' : 'New Chat'}
          </h1>
          <div className="flex items-center gap-3">
            <ToolSelector
              enabledTools={enabledTools}
              onToolsChange={setEnabledTools}
            />
            <ProviderSelector
              selectedProvider={selectedProvider}
              selectedModel={selectedModel}
              onProviderChange={handleProviderChange}
            />
          </div>
        </div>

        {/* System prompt input */}
        <div className="mt-2">
          <input
            type="text"
            placeholder="System prompt (optional)"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full px-3 py-1 text-sm border rounded-md bg-background"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
        />
      </div>

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

      {/* Input */}
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
    </div>
  );
}