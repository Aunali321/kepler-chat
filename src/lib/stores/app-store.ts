import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ToolName } from '@/lib/tools';
import type { ProviderType, UserPreferences } from '@/lib/db/types';

// Chat Settings
export interface ChatSettings {
  selectedProvider: ProviderType;
  selectedModel: string;
  systemPrompt: string;
  enabledTools: ToolName[];
  customTools: Record<string, any>;
  temperature: number;
  maxTokens: number;
  topP: number;
  showSystemPrompt: boolean;
}

// UI Settings
export interface UISettings {}

// Notification Settings
export interface NotificationSettings {
  chatNotifications: boolean;
  shareNotifications: boolean;
  emailNotifications: boolean;
}

// UI State (transient)
export interface UIState {
  searchDialogOpen: boolean;
  exportDialogOpen: boolean;
  shareDialogOpen: boolean;
  settingsDialogOpen: boolean;
  activeSettingsTab: string;
}

// App State
export interface AppState {
  // Chat state
  chat: ChatSettings & {
    isLoading: boolean;
    isGenerating: boolean;
    currentChatId: string | null;
  };

  // UI state
  ui: UIState & UISettings;

  // User preferences
  preferences: {
    theme: string | null;
    language: string | null;
    notificationSettings: NotificationSettings;
    hasChanges: boolean;
    isLoading: boolean;
    isSaving: boolean;
  };

  // Chat actions
  setProvider: (provider: ProviderType) => void;
  setModel: (model: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setTopP: (topP: number) => void;
  enableTool: (toolId: ToolName) => void;
  disableTool: (toolId: ToolName) => void;
  toggleTool: (toolId: ToolName) => void;
  setEnabledTools: (tools: ToolName[]) => void;
  setCustomTool: (toolId: string, config: any) => void;
  removeCustomTool: (toolId: string) => void;
  setShowSystemPrompt: (show: boolean) => void;
  setCurrentChatId: (chatId: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsGenerating: (generating: boolean) => void;

  // UI actions
  openSearchDialog: () => void;
  closeSearchDialog: () => void;
  openExportDialog: () => void;
  closeExportDialog: () => void;
  openShareDialog: () => void;
  closeShareDialog: () => void;
  openSettingsDialog: (tab?: string) => void;
  closeSettingsDialog: () => void;
  setActiveSettingsTab: (tab: string) => void;

  // Preference actions
  updatePreference: (key: string, value: any) => void;
  updateChatSetting: (key: string, value: any) => void;
  updateUISetting: (key: string, value: any) => void;
  updateNotificationSetting: (key: keyof NotificationSettings, value: any) => void;
  savePreferences: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  resetChanges: () => void;
  applyTheme: () => void;

  // Utility actions
  resetToDefaults: () => void;
  initializeFromPreferences: (prefs: UserPreferences) => void;
}

const defaultChatSettings: ChatSettings = {
  selectedProvider: 'google',
  selectedModel: 'gemini-2.0-flash',
  systemPrompt: '',
  enabledTools: [],
  customTools: {},
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  showSystemPrompt: false,
};

const defaultUISettings: UISettings = {};

const defaultUIState: UIState = {
  searchDialogOpen: false,
  exportDialogOpen: false,
  shareDialogOpen: false,
  settingsDialogOpen: false,
  activeSettingsTab: 'profile',
};

const defaultNotificationSettings: NotificationSettings = {
  chatNotifications: true,
  shareNotifications: true,
  emailNotifications: false,
};

export const useAppStore = create<AppState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      chat: {
        ...defaultChatSettings,
        isLoading: false,
        isGenerating: false,
        currentChatId: null,
      },

      ui: {
        ...defaultUIState,
        ...defaultUISettings,
      },

      preferences: {
        theme: 'dark',
        language: 'en',
        notificationSettings: defaultNotificationSettings,
        hasChanges: false,
        isLoading: false,
        isSaving: false,
      },

      // Chat actions
      setProvider: (provider) => {
        set((state) => {
          state.chat.selectedProvider = provider;
          // Reset model to default for new provider
          switch (provider) {
            case 'openai':
              state.chat.selectedModel = 'gpt-4o-mini';
              break;
            case 'anthropic':
              state.chat.selectedModel = 'claude-3-5-sonnet';
              break;
            case 'google':
              state.chat.selectedModel = 'gemini-2.0-flash';
              break;
            case 'openrouter':
              state.chat.selectedModel = 'claude-3-5-sonnet';
              break;
            default:
              state.chat.selectedModel = 'gemini-2.0-flash';
          }
        });
      },

      setModel: (model) => {
        set((state) => {
          state.chat.selectedModel = model;
        });
      },

      setSystemPrompt: (prompt) => {
        set((state) => {
          state.chat.systemPrompt = prompt;
        });
      },

      setTemperature: (temp) => {
        set((state) => {
          state.chat.temperature = Math.max(0, Math.min(2, temp));
        });
      },

      setMaxTokens: (tokens) => {
        set((state) => {
          state.chat.maxTokens = Math.max(1, Math.min(32768, tokens));
        });
      },

      setTopP: (topP) => {
        set((state) => {
          state.chat.topP = Math.max(0, Math.min(1, topP));
        });
      },

      enableTool: (toolId) => {
        set((state) => {
          if (!state.chat.enabledTools.includes(toolId)) {
            state.chat.enabledTools.push(toolId);
          }
        });
      },

      disableTool: (toolId) => {
        set((state) => {
          state.chat.enabledTools = state.chat.enabledTools.filter(id => id !== toolId);
        });
      },

      toggleTool: (toolId) => {
        set((state) => {
          if (state.chat.enabledTools.includes(toolId)) {
            state.chat.enabledTools = state.chat.enabledTools.filter(id => id !== toolId);
          } else {
            state.chat.enabledTools.push(toolId);
          }
        });
      },

      setEnabledTools: (tools) => {
        set((state) => {
          state.chat.enabledTools = tools;
        });
      },

      setCustomTool: (toolId, config) => {
        set((state) => {
          state.chat.customTools[toolId] = config;
        });
      },

      removeCustomTool: (toolId) => {
        set((state) => {
          delete state.chat.customTools[toolId];
        });
      },

      setShowSystemPrompt: (show) => {
        set((state) => {
          state.chat.showSystemPrompt = show;
        });
      },



      setCurrentChatId: (chatId) => {
        set((state) => {
          state.chat.currentChatId = chatId;
        });
      },

      setIsLoading: (loading) => {
        set((state) => {
          state.chat.isLoading = loading;
        });
      },

      setIsGenerating: (generating) => {
        set((state) => {
          state.chat.isGenerating = generating;
        });
      },

      // UI actions
      openSearchDialog: () => {
        set((state) => {
          state.ui.searchDialogOpen = true;
        });
      },

      closeSearchDialog: () => {
        set((state) => {
          state.ui.searchDialogOpen = false;
        });
      },

      openExportDialog: () => {
        set((state) => {
          state.ui.exportDialogOpen = true;
        });
      },

      closeExportDialog: () => {
        set((state) => {
          state.ui.exportDialogOpen = false;
        });
      },

      openShareDialog: () => {
        set((state) => {
          state.ui.shareDialogOpen = true;
        });
      },

      closeShareDialog: () => {
        set((state) => {
          state.ui.shareDialogOpen = false;
        });
      },

      openSettingsDialog: (tab = 'profile') => {
        set((state) => {
          state.ui.settingsDialogOpen = true;
          state.ui.activeSettingsTab = tab;
        });
      },

      closeSettingsDialog: () => {
        set((state) => {
          state.ui.settingsDialogOpen = false;
        });
      },

      setActiveSettingsTab: (tab) => {
        set((state) => {
          state.ui.activeSettingsTab = tab;
        });
      },



      // Preference actions
      updatePreference: (key, value) => {
        set((state) => {
          (state.preferences as any)[key] = value;
          state.preferences.hasChanges = true;
        });
      },

      updateChatSetting: (key, value) => {
        set((state) => {
          (state.chat as any)[key] = value;
          state.preferences.hasChanges = true;
        });
      },

      updateUISetting: (key, value) => {
        set((state) => {
          (state.ui as any)[key] = value;
          state.preferences.hasChanges = true;
        });
      },

      updateNotificationSetting: (key, value) => {
        set((state) => {
          state.preferences.notificationSettings[key] = value;
          state.preferences.hasChanges = true;
        });
      },

      savePreferences: async () => {
        const state = get();
        if (!state.preferences.hasChanges) return;

        set((state) => {
          state.preferences.isSaving = true;
        });

        try {
          const { hasChanges, isLoading, isSaving, ...preferences } = state.preferences;
          const uiSettings = {};
          const chatSettings = {};

          const response = await fetch('/api/user/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...preferences,
              uiSettings,
              chatSettings,
            }),
          });

          if (response.ok) {
            set((state) => {
              state.preferences.hasChanges = false;
              state.preferences.isSaving = false;
            });
            get().applyTheme();
          } else {
            throw new Error('Failed to save preferences');
          }
        } catch (error) {
          console.error('Error saving preferences:', error);
          set((state) => {
            state.preferences.isSaving = false;
          });
        }
      },

      loadPreferences: async () => {
        set((state) => {
          state.preferences.isLoading = true;
        });

        try {
          const response = await fetch('/api/user/preferences');
          if (response.ok) {
            const data = await response.json();
            get().initializeFromPreferences(data.preferences);
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
        } finally {
          set((state) => {
            state.preferences.isLoading = false;
          });
        }
      },

      resetChanges: () => {
        set((state) => {
          state.preferences.hasChanges = false;
        });
      },

      applyTheme: () => {
        if (typeof document !== 'undefined') {
          const { theme } = get().preferences;
          if (theme === 'dark' || theme === 'system') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      // Utility actions
      resetToDefaults: () => {
        set((state) => {
          Object.assign(state.chat, defaultChatSettings);
          state.chat.isLoading = false;
          state.chat.isGenerating = false;
          state.chat.currentChatId = null;
        });
      },

      initializeFromPreferences: (prefs) => {
        if (!prefs) return;
        
        set((state) => {
          // Update preferences
          if (prefs.theme) state.preferences.theme = prefs.theme;
          if (prefs.language) state.preferences.language = prefs.language;
          if (prefs.notificationSettings && typeof prefs.notificationSettings === 'object') {
            // Merge with defaults to ensure all required properties exist
            state.preferences.notificationSettings = {
              ...defaultNotificationSettings,
              ...prefs.notificationSettings
            };
          }

          // Update UI settings - currently none
          // Update chat settings - currently none

          state.preferences.hasChanges = false;
        });

        get().applyTheme();
      },
    })),
    {
      name: 'kepler-app-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        chat: {
          selectedProvider: state.chat.selectedProvider,
          selectedModel: state.chat.selectedModel,
          systemPrompt: state.chat.systemPrompt,
          enabledTools: state.chat.enabledTools,
          customTools: state.chat.customTools,
          temperature: state.chat.temperature,
          maxTokens: state.chat.maxTokens,
          topP: state.chat.topP,
          showSystemPrompt: state.chat.showSystemPrompt,
        },
        ui: {
          activeSettingsTab: state.ui.activeSettingsTab,
        },
        preferences: {
          theme: state.preferences.theme,
          language: state.preferences.language,
          notificationSettings: state.preferences.notificationSettings,
        },
      }),
    }
  )
);

// Initialize theme on app load
if (typeof window !== 'undefined') {
  const state = useAppStore.getState();
  state.applyTheme();
}