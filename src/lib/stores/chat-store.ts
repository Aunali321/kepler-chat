import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ToolName } from '@/lib/tools';
import type { ProviderKey } from '@/lib/providers';

export interface ChatSettings {
  // Provider and model selection
  selectedProvider: ProviderKey;
  selectedModel: string;

  // System prompt
  systemPrompt: string;

  // Tool configurations
  enabledTools: ToolName[];
  customTools: Record<string, any>;

  // Chat parameters
  temperature: number;
  maxTokens: number;
  topP: number;

  // UI preferences for chat
  showSystemPrompt: boolean;
  showTokenCount: boolean;
  streamingEnabled: boolean;
}

export interface ChatState extends ChatSettings {
  // Loading states
  isLoading: boolean;
  isGenerating: boolean;

  // Current chat context
  currentChatId: string | null;

  // Actions
  setProvider: (provider: ProviderKey) => void;
  setModel: (model: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setTopP: (topP: number) => void;

  // Tool actions
  enableTool: (toolId: ToolName) => void;
  disableTool: (toolId: ToolName) => void;
  toggleTool: (toolId: ToolName) => void;
  setEnabledTools: (tools: ToolName[]) => void;
  setCustomTool: (toolId: string, config: any) => void;
  removeCustomTool: (toolId: string) => void;

  // UI actions
  setShowSystemPrompt: (show: boolean) => void;
  setShowTokenCount: (show: boolean) => void;
  setStreamingEnabled: (enabled: boolean) => void;

  // Chat actions
  setCurrentChatId: (chatId: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsGenerating: (generating: boolean) => void;

  // Reset actions
  resetToDefaults: () => void;
  loadFromPreferences: () => void;
}

const defaultChatSettings: ChatSettings = {
  selectedProvider: 'openai',
  selectedModel: 'gpt-4.1-mini',
  systemPrompt: '',
  enabledTools: [],
  customTools: {},
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  showSystemPrompt: false,
  showTokenCount: false,
  streamingEnabled: true,
};

export const useChatStore = create<ChatState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      ...defaultChatSettings,
      isLoading: false,
      isGenerating: false,
      currentChatId: null,

      // Provider and model actions
      setProvider: (provider) => {
        set((state) => {
          state.selectedProvider = provider;
          // Reset model to default for new provider
          switch (provider) {
            case 'openai':
              state.selectedModel = 'gpt-4.1-mini';
              break;
            case 'anthropic':
              state.selectedModel = 'claude-3-5-sonnet';
              break;
            case 'google':
              state.selectedModel = 'google/gemini-2.5-flash-preview-05-20';
              break;
            case 'openrouter':
              state.selectedModel = 'gpt-4o-mini';
              break;
            default:
              state.selectedModel = 'gpt-4o-mini';
          }
        });
      },

      setModel: (model) => {
        set((state) => {
          state.selectedModel = model;
        });
      },

      setSystemPrompt: (prompt) => {
        set((state) => {
          state.systemPrompt = prompt;
        });
      },

      setTemperature: (temp) => {
        set((state) => {
          state.temperature = Math.max(0, Math.min(2, temp));
        });
      },

      setMaxTokens: (tokens) => {
        set((state) => {
          state.maxTokens = Math.max(1, Math.min(32768, tokens));
        });
      },

      setTopP: (topP) => {
        set((state) => {
          state.topP = Math.max(0, Math.min(1, topP));
        });
      },

      // Tool actions
      enableTool: (toolId) => {
        set((state) => {
          if (!state.enabledTools.includes(toolId)) {
            state.enabledTools.push(toolId);
          }
        });
      },

      disableTool: (toolId) => {
        set((state) => {
          const index = state.enabledTools.indexOf(toolId);
          if (index !== -1) {
            state.enabledTools.splice(index, 1);
          }
        });
      },

      toggleTool: (toolId) => {
        const state = get();
        if (state.enabledTools.includes(toolId)) {
          state.disableTool(toolId);
        } else {
          state.enableTool(toolId);
        }
      },

      setEnabledTools: (tools) => {
        set((state) => {
          state.enabledTools = tools;
        });
      },

      setCustomTool: (toolId, config) => {
        set((state) => {
          state.customTools[toolId] = config;
        });
      },

      removeCustomTool: (toolId) => {
        set((state) => {
          delete state.customTools[toolId];
          // Also disable the tool if it's enabled (only if it's a valid ToolName)
          const toolName = toolId as ToolName;
          const index = state.enabledTools.indexOf(toolName);
          if (index !== -1) {
            state.enabledTools.splice(index, 1);
          }
        });
      },

      // UI actions
      setShowSystemPrompt: (show) => {
        set((state) => {
          state.showSystemPrompt = show;
        });
      },

      setShowTokenCount: (show) => {
        set((state) => {
          state.showTokenCount = show;
        });
      },

      setStreamingEnabled: (enabled) => {
        set((state) => {
          state.streamingEnabled = enabled;
        });
      },

      // Chat actions
      setCurrentChatId: (chatId) => {
        set((state) => {
          state.currentChatId = chatId;
        });
      },

      setIsLoading: (loading) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setIsGenerating: (generating) => {
        set((state) => {
          state.isGenerating = generating;
        });
      },

      // Reset actions
      resetToDefaults: () => {
        set((state) => {
          Object.assign(state, defaultChatSettings);
          state.isLoading = false;
          state.isGenerating = false;
        });
      },

      loadFromPreferences: async () => {
        try {
          const response = await fetch('/api/user/preferences');
          if (response.ok) {
            const data = await response.json();
            const preferences = data.preferences;

            set((state) => {
              if (preferences.defaultProvider) {
                state.selectedProvider = preferences.defaultProvider;
              }
              if (preferences.defaultModel) {
                state.selectedModel = preferences.defaultModel;
              }

              // Load chat settings from preferences
              const chatSettings = preferences.chatSettings || {};
              if (typeof chatSettings.streamingResponses === 'boolean') {
                state.streamingEnabled = chatSettings.streamingResponses;
              }
              if (typeof chatSettings.showTokenCount === 'boolean') {
                state.showTokenCount = chatSettings.showTokenCount;
              }
            });
          }
        } catch (error) {
          console.error('Failed to load preferences for chat store:', error);
        }
      },
    })),
    {
      name: 'kepler-chat-state',
      storage: createJSONStorage(() => localStorage),
      // Persist all chat settings but not loading states
      partialize: (state) => {
        const { isLoading, isGenerating, currentChatId, ...persistedState } = state;
        return persistedState;
      },
    }
  )
);

// Note: loadFromPreferences will be called manually when needed to avoid excessive API calls