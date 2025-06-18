import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ToolName } from '@/lib/tools';
import type { ProviderType } from '@/lib/db/types';
import { usePreferencesStore } from './preferences-store';
import type { ChatSettings as UserChatSettings } from './settings-store';

export interface ChatSettings {
  // Provider and model selection
  selectedProvider: ProviderType;
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
  setProvider: (provider: ProviderType) => void;
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
  initializeFromPreferences: () => void;
}

const defaultChatSettings: ChatSettings = {
  selectedProvider: 'google',
  selectedModel: 'gemini-1.5-flash',
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
              state.selectedModel = 'gemini-2.0-flash';
              break;
            case 'openrouter':
              state.selectedModel = 'claude-3-5-sonnet';
              break;
            default:
              state.selectedModel = 'gemini-2.0-flash';
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
          state.enabledTools = state.enabledTools.filter(id => id !== toolId);
        });
      },

      toggleTool: (toolId) => {
        set((state) => {
          if (state.enabledTools.includes(toolId)) {
            state.enabledTools = state.enabledTools.filter(id => id !== toolId);
          } else {
            state.enabledTools.push(toolId);
          }
        });
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

      initializeFromPreferences: () => {
        const { preferences } = usePreferencesStore.getState();
        if (preferences?.chatSettings) {
          const chatSettings = preferences.chatSettings as UserChatSettings;
          set((state) => {
            if (typeof chatSettings.streamingResponses === 'boolean') {
              state.streamingEnabled = chatSettings.streamingResponses;
            }
            if (typeof chatSettings.showTokenCount === 'boolean') {
              state.showTokenCount = chatSettings.showTokenCount;
            }
          });
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

// Note: initializeFromPreferences will be called manually when needed to avoid excessive API calls