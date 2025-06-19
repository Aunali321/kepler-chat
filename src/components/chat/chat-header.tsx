"use client";

import { memo, useCallback } from "react";
import { Search, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderSelector } from "./provider-selector";
import { ToolSelector } from "./tool-selector";
import { useChatContext } from "@/context/chat-context";

interface ChatHeaderProps {
  chatTitle?: string;
}

export const ChatHeader = memo(function ChatHeader({ chatTitle }: ChatHeaderProps) {
  const {
    chatId,
    selectedProvider,
    selectedModel,
    systemPrompt,
    enabledTools,
    setProvider,
    setModel,
    setSystemPrompt,
    setEnabledTools,
    openSearchDialog,
    openExportDialog,
    openShareDialog,
  } = useChatContext();

  const handleProviderChange = useCallback((provider: any, model: string) => {
    setProvider(provider);
    setModel(model);
  }, [setProvider, setModel]);

  const handleToolsChange = useCallback((tools: any[]) => {
    setEnabledTools(tools);
  }, [setEnabledTools]);

  return (
    <div className="border-b p-4 bg-background/95 backdrop-blur z-30 relative">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          {chatTitle || (chatId ? "Chat" : "New Chat")}
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
  );
});