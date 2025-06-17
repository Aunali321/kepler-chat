'use client';

import { useChat } from 'ai/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, Share2, Settings } from 'lucide-react';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { ProviderSelector } from './provider-selector';
import { ToolSelector } from './tool-selector';
import { LoadingIndicator } from './loading-indicator';
import { SearchDialog } from './search-dialog';
import { ExportDialog } from './export-dialog';
import { ShareDialog } from './share-dialog';
import { Button } from '@/components/ui/button';
import { type ProviderType } from '@/lib/db/types';
import { defaultTools, type ToolName } from '@/lib/tools';
import { useChatStore } from '@/lib/stores/chat-store';
import { useUIStore } from '@/lib/stores/ui-store';

interface ChatInterfaceProps {
  chatId?: string;
  initialMessages?: any[];
  chatTitle?: string;
}

export function ChatInterface({ chatId, initialMessages = [], chatTitle }: ChatInterfaceProps) {
  const router = useRouter();

  // Chat store
  const {
    selectedProvider,
    selectedModel,
    systemPrompt,
    enabledTools,
    setProvider,
    setModel,
    setSystemPrompt,
    setEnabledTools,
    setCurrentChatId,
    setIsGenerating,
    loadFromPreferences,
  } = useChatStore();

  // UI store for dialog states
  const {
    searchDialogOpen,
    exportDialogOpen,
    shareDialogOpen,
    openSearchDialog,
    closeSearchDialog,
    openExportDialog,
    closeExportDialog,
    openShareDialog,
    closeShareDialog,
  } = useUIStore();

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
      console.error('=== CLIENT-SIDE CHAT ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error type:', error.constructor.name);
      console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      console.error('Current provider/model:', { selectedProvider, selectedModel });
      setIsGenerating(false);
    },
    onFinish: (message, { usage, finishReason }) => {
      console.log('=== MESSAGE FINISHED SUCCESSFULLY ===');
      console.log('Message:', message);
      console.log('Usage:', usage);
      console.log('Finish reason:', finishReason);
      setIsGenerating(false);
    },
    // Add fetch interceptor to debug streaming data
    fetch: async (url, options) => {
      console.log('=== FETCH REQUEST DEBUG ===');
      console.log('URL:', url);
      console.log('Options:', options);
      
      const response = await fetch(url, options);
      
      console.log('=== FETCH RESPONSE DEBUG ===');
      console.log('Status:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      console.log('Response body stream available:', !!response.body);
      
      return response;
    },
  });

  // Load chat preferences on component mount  
  useEffect(() => {
    const initializeChatPreferences = async () => {
      console.log('🔧 Loading chat preferences...');
      try {
        // Load chat preferences (settings should already be loaded by StoreProvider)
        await loadFromPreferences();
        console.log('✅ Chat preferences loaded');
      } catch (error) {
        console.error('❌ Error loading chat preferences:', error);
      }
    };

    initializeChatPreferences();
  }, [loadFromPreferences]);

  // Set current chat ID and update generation state
  useEffect(() => {
    setCurrentChatId(chatId || null);
    setIsGenerating(isLoading);
  }, [chatId, isLoading, setCurrentChatId, setIsGenerating]);

  // Debug current provider/model
  useEffect(() => {
    console.log('🎛️ Current chat settings:', { selectedProvider, selectedModel });
  }, [selectedProvider, selectedModel]);

  const handleProviderChange = (provider: ProviderType, model: string) => {
    setProvider(provider);
    setModel(model);
  };

  const handleToolsChange = (tools: ToolName[]) => {
    // Update enabled tools in store
    setEnabledTools(tools);
  };

  const handleChatSelect = (selectedChatId: string) => {
    // Navigate to the selected chat
    router.push(`/chat/${selectedChatId}`);
  };

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header with provider selector */}
      <div className="border-b p-4 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            {chatTitle || (chatId ? 'Chat' : 'New Chat')}
          </h1>
          <div className="flex items-center gap-3">
            {/* Chat Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={openSearchDialog}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </Button>

            {chatId && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openExportDialog}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={openShareDialog}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </>
            )}

            <ToolSelector
              enabledTools={enabledTools}
              onToolsChange={handleToolsChange}
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

      {/* Dialogs */}
      <SearchDialog
        isOpen={searchDialogOpen}
        onClose={closeSearchDialog}
        onChatSelect={handleChatSelect}
      />

      {chatId && (
        <>
          <ExportDialog
            isOpen={exportDialogOpen}
            onClose={closeExportDialog}
            chatId={chatId}
            chatTitle={chatTitle || 'Chat'}
          />

          <ShareDialog
            isOpen={shareDialogOpen}
            onClose={closeShareDialog}
            chatId={chatId}
            chatTitle={chatTitle || 'Chat'}
          />
        </>
      )}
    </div>
  );
}