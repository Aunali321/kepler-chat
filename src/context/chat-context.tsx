"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useChat } from "ai/react";
import { type Message as AIMessage } from "ai";
import { type ProviderType } from "@/lib/db/types";
import { type ToolName } from "@/lib/tools";
import { useAppStore } from "@/lib/stores/app-store";

interface ChatContextValue {
  // Chat state
  chatId: string | null;
  messages: AIMessage[];
  isLoading: boolean;
  error: Error | null;

  // Provider state
  selectedProvider: ProviderType;
  selectedModel: string;
  systemPrompt: string;
  enabledTools: ToolName[];

  // Chat actions
  input: string;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    chatRequestOptions?: { data?: any }
  ) => void;
  reload: () => void;
  stop: () => void;
  setMessages: (messages: AIMessage[]) => void;

  // Provider actions
  setProvider: (provider: ProviderType) => void;
  setModel: (model: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setEnabledTools: (tools: ToolName[]) => void;

  // UI state
  searchDialogOpen: boolean;
  exportDialogOpen: boolean;
  shareDialogOpen: boolean;
  settingsDialogOpen: boolean;

  // UI actions
  openSearchDialog: () => void;
  closeSearchDialog: () => void;
  openExportDialog: () => void;
  closeExportDialog: () => void;
  openShareDialog: () => void;
  closeShareDialog: () => void;
  openSettingsDialog: () => void;
  closeSettingsDialog: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}

interface ChatProviderProps {
  children: React.ReactNode;
  chatId?: string;
  initialMessages?: any[];
  chatTitle?: string;
}

export function ChatProvider({
  children,
  chatId,
  initialMessages = [],
}: ChatProviderProps) {
  // App store (consolidated chat + UI state)
  const {
    chat: { selectedProvider, selectedModel, systemPrompt, enabledTools },
    ui: {
      searchDialogOpen,
      exportDialogOpen,
      shareDialogOpen,
      settingsDialogOpen,
    },
    setProvider,
    setModel,
    setSystemPrompt,
    setEnabledTools,
    setCurrentChatId,
    setIsGenerating,
    openSearchDialog,
    closeSearchDialog,
    openExportDialog,
    closeExportDialog,
    openShareDialog,
    closeShareDialog,
    openSettingsDialog,
    closeSettingsDialog,
  } = useAppStore();

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
    api: "/api/chat",
    body: {
      chatId,
      provider: selectedProvider,
      model: selectedModel,
      systemPrompt,
      enabledTools,
    },
    initialMessages,
    // Prevent automatic message submission for existing messages
    id: chatId || "new-chat", // Unique ID to prevent collision
    // Configure to send only new messages, not the entire history
    sendExtraMessageFields: true, // Include IDs to help server identify existing messages
    onError: (error) => {
      console.error("=== CLIENT-SIDE CHAT ERROR ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Error type:", error.constructor.name);
      console.error(
        "Full error details:",
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      );
      console.error("Current provider/model:", {
        selectedProvider,
        selectedModel,
      });
      setIsGenerating(false);
    },
    onFinish: (message, { usage, finishReason }) => {
      console.log("=== MESSAGE FINISHED SUCCESSFULLY ===");
      console.log("Message:", message);
      console.log("Usage:", usage);
      console.log("Finish reason:", finishReason);
      setIsGenerating(false);
    },
    // Add fetch interceptor to debug streaming data
    fetch: async (url, options) => {
      console.log("=== FETCH REQUEST DEBUG ===");
      console.log("URL:", url);
      console.log("Options:", JSON.stringify(options, null, 2));
      console.log("Chat ID:", chatId);
      console.log("Initial messages count:", initialMessages.length);

      const response = await fetch(url, options);

      console.log("=== FETCH RESPONSE DEBUG ===");
      console.log("Status:", response.status);
      console.log("Headers:", Object.fromEntries(response.headers.entries()));
      console.log("Response body stream available:", !!response.body);

      return response;
    },
  });

  // Set current chat ID and update generation state
  React.useEffect(() => {
    setCurrentChatId(chatId || null);
    setIsGenerating(isLoading);
  }, [chatId, isLoading, setCurrentChatId, setIsGenerating]);

  // Debug current provider/model
  React.useEffect(() => {
    console.log("🎛️ Current chat settings:", {
      selectedProvider,
      selectedModel,
    });
  }, [selectedProvider, selectedModel]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      // Chat state
      chatId: chatId || null,
      messages,
      isLoading,
      error: error || null,

      // Provider state
      selectedProvider,
      selectedModel,
      systemPrompt,
      enabledTools,

      // Chat actions
      input,
      handleInputChange,
      handleSubmit,
      reload,
      stop,
      setMessages,

      // Provider actions
      setProvider,
      setModel,
      setSystemPrompt,
      setEnabledTools,

      // UI state
      searchDialogOpen,
      exportDialogOpen,
      shareDialogOpen,
      settingsDialogOpen,

      // UI actions
      openSearchDialog,
      closeSearchDialog,
      openExportDialog,
      closeExportDialog,
      openShareDialog,
      closeShareDialog,
      openSettingsDialog,
      closeSettingsDialog,
    }),
    [
      chatId,
      messages,
      isLoading,
      error,
      selectedProvider,
      selectedModel,
      systemPrompt,
      enabledTools,
      input,
      handleInputChange,
      handleSubmit,
      reload,
      stop,
      setMessages,
      setProvider,
      setModel,
      setSystemPrompt,
      setEnabledTools,
      searchDialogOpen,
      exportDialogOpen,
      shareDialogOpen,
      settingsDialogOpen,
      openSearchDialog,
      closeSearchDialog,
      openExportDialog,
      closeExportDialog,
      openShareDialog,
      closeShareDialog,
      openSettingsDialog,
      closeSettingsDialog,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export { ChatContext };
