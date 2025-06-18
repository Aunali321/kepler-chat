import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UserPreferences } from '@/lib/db/types';
import { usePreferencesStore } from './preferences-store';

export interface ChatSettings {
  autoSave: boolean;
  streamingResponses: boolean;
  showTokenCount: boolean;
}

export interface UISettings {
  fontSize: 'small' | 'medium' | 'large';
  sidebarWidth: 'small' | 'normal' | 'large';
  timezone: string;
}

export interface NotificationSettings {
  chatNotifications: boolean;
  shareNotifications: boolean;
  emailNotifications: boolean;
}

export interface ProviderSettings {
  autoValidateApiKeys: boolean;
  showProviderCosts: boolean;
  enableModelFallback: boolean;
  fallbackOrder: string[];
}

export interface SettingsState {
  // User preferences (matching database structure)
  theme: string | null;
  language: string | null;
  chatSettings: ChatSettings;
  uiSettings: UISettings;
  notificationSettings: NotificationSettings;

  // Provider-related settings
  providerSettings: ProviderSettings;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;

  // Actions
  initializeSettings: () => void;
  savePreferences: () => Promise<void>;
  updatePreference: (key: string, value: any) => void;
  updateChatSetting: (key: keyof ChatSettings, value: any) => void;
  updateUISetting: (key: keyof UISettings, value: any) => void;
  updateNotificationSetting: (key: keyof NotificationSettings, value: any) => void;
  updateProviderSetting: (key: keyof ProviderSettings, value: any) => void;
  resetChanges: () => void;
  applyTheme: () => void;
}

const defaultPreferences = {
  theme: 'dark',
  language: 'en',
  chatSettings: {
    autoSave: true,
    streamingResponses: true,
    showTokenCount: false,
  },
  uiSettings: {
    fontSize: 'medium' as const,
    sidebarWidth: 'normal' as const,
    timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC',
  },
  notificationSettings: {
    chatNotifications: true,
    shareNotifications: true,
    emailNotifications: false,
  },
  providerSettings: {
    autoValidateApiKeys: true,
    showProviderCosts: true,
    enableModelFallback: true,
    fallbackOrder: ['openai', 'anthropic', 'google', 'openrouter'],
  },
};

// Track if preferences are being loaded to prevent duplicate requests
let isLoadingPreferences = false;
let hasLoadedPreferences = false;

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      ...defaultPreferences,
      isLoading: false,
      isSaving: false,
      hasChanges: false,

      // Initialize settings from preferences store
      initializeSettings: () => {
        const { preferences } = usePreferencesStore.getState();
        if (preferences) {
          set((state) => {
            Object.assign(state, preferences);
            state.hasChanges = false;
          });
          get().applyTheme();
        }
      },

      // Save preferences to server
      savePreferences: async () => {
        const state = get();
        if (!state.hasChanges) return;

        set((state) => {
          state.isSaving = true;
        });

        try {
          const { isSaving, hasChanges, ...preferences } = state;

          const response = await fetch('/api/user/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(preferences),
          });

          if (response.ok) {
            set((state) => {
              state.hasChanges = false;
              state.isSaving = false;
            });

            // Re-fetch preferences in the preferences-store to keep it in sync
            usePreferencesStore.setState({ preferences: null });
            await usePreferencesStore.getState().loadPreferences();

            // Apply theme after saving
            get().applyTheme();
          } else {
            throw new Error('Failed to save preferences');
          }
        } catch (error) {
          console.error('Error saving preferences:', error);
          set((state) => {
            state.isSaving = false;
          });
        }
      },

      // Update a top-level preference
      updatePreference: (key, value) => {
        set((state) => {
          (state as any)[key] = value;
          state.hasChanges = true;
        });
      },

      // Update chat settings
      updateChatSetting: (key, value) => {
        set((state) => {
          state.chatSettings[key] = value;
          state.hasChanges = true;
        });
      },

      // Update UI settings
      updateUISetting: (key, value) => {
        set((state) => {
          state.uiSettings[key] = value;
          state.hasChanges = true;
        });
      },

      // Update notification settings
      updateNotificationSetting: (key, value) => {
        set((state) => {
          state.notificationSettings[key] = value;
          state.hasChanges = true;
        });
      },

      // Update provider settings
      updateProviderSetting: (key, value) => {
        set((state) => {
          state.providerSettings[key] = value;
          state.hasChanges = true;
        });
      },

      // Reset changes to last saved state
      resetChanges: () => {
        set((state) => {
          state.hasChanges = false;
        });
      },

      // Apply theme to document
      applyTheme: () => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.add('dark');
        }
      },
    })),
    {
      name: 'kepler-settings',
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences, not loading states
      partialize: (state) => {
        const { isSaving, hasChanges, ...preferences } = state;
        return preferences;
      },
    }
  )
);

// Theme provider hook that listens to system theme changes
export const useThemeWatcher = () => {
  const { theme, applyTheme } = useSettingsStore();

  if (typeof window !== 'undefined' && theme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      applyTheme();
    };

    mediaQuery.addEventListener('change', handleChange);

    // Cleanup function
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }
};

// Initialize theme on app load
if (typeof window !== 'undefined') {
  // Apply theme immediately on load
  const state = useSettingsStore.getState();
  state.applyTheme();
}