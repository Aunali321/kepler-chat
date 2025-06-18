import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UserPreferences } from '@/lib/db/types';

export interface SettingsState {
  // User preferences (matching database structure)
  theme: string | null;
  language: string | null;
  chatSettings: unknown;
  uiSettings: unknown;
  notificationSettings: unknown;

  // Provider-related settings
  providerSettings: {
    autoValidateApiKeys: boolean;
    showProviderCosts: boolean;
    enableModelFallback: boolean;
    fallbackOrder: string[];
  };

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;

  // Actions
  loadPreferences: () => Promise<void>;
  savePreferences: () => Promise<void>;
  updatePreference: (key: string, value: any) => void;
  updateChatSetting: (key: string, value: any) => void;
  updateUISetting: (key: string, value: any) => void;
  updateNotificationSetting: (key: string, value: any) => void;
  updateProviderSetting: (key: string, value: any) => void;
  resetChanges: () => void;
  applyTheme: () => void;
}

const defaultPreferences = {
  theme: 'system',
  language: 'en',
  chatSettings: {
    autoSave: true,
    streamingResponses: true,
    showTokenCount: false,
  },
  uiSettings: {
    fontSize: 'medium',
    sidebarWidth: 'normal',
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

      // Load preferences from server
      loadPreferences: async () => {
        // Prevent duplicate requests
        if (isLoadingPreferences || hasLoadedPreferences) {
          return;
        }

        isLoadingPreferences = true;
        set((state) => {
          state.isLoading = true;
        });

        try {
          const response = await fetch('/api/user/preferences');
          if (response.ok) {
            const data = await response.json();
            set((state) => {
              Object.assign(state, data.preferences);
              state.isLoading = false;
              state.hasChanges = false;
            });

            hasLoadedPreferences = true;

            // Apply theme immediately after loading
            get().applyTheme();
          } else {
            throw new Error('Failed to load preferences');
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
          set((state) => {
            state.isLoading = false;
          });
        } finally {
          isLoadingPreferences = false;
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
          const { isLoading, isSaving, hasChanges, ...preferences } = state;

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
          state.chatSettings = {
            ...(state.chatSettings as object || {}),
            [key]: value,
          };
          state.hasChanges = true;
        });
      },

      // Update UI settings
      updateUISetting: (key, value) => {
        set((state) => {
          state.uiSettings = {
            ...(state.uiSettings as object || {}),
            [key]: value,
          };
          state.hasChanges = true;
        });
      },

      // Update notification settings
      updateNotificationSetting: (key, value) => {
        set((state) => {
          state.notificationSettings = {
            ...(state.notificationSettings as object || {}),
            [key]: value,
          };
          state.hasChanges = true;
        });
      },

      // Update provider settings
      updateProviderSetting: (key, value) => {
        set((state) => {
          state.providerSettings = {
            ...(state.providerSettings as object || {}),
            [key]: value,
          };
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
        const theme = get().theme;
        if (theme && typeof document !== 'undefined') {
          if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
          } else {
            document.documentElement.setAttribute('data-theme', theme);
          }
        }
      },
    })),
    {
      name: 'kepler-settings',
      storage: createJSONStorage(() => localStorage),
      // Only persist user preferences, not loading states
      partialize: (state) => {
        const { isLoading, isSaving, hasChanges, ...preferences } = state;
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