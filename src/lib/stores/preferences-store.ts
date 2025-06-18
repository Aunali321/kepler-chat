import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { UserPreferences } from '@/lib/db/types';

export interface PreferencesState {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  loadPreferences: () => Promise<void>;
}

// Track if preferences are being loaded to prevent duplicate requests
let isLoadingPreferences = false;

export const usePreferencesStore = create<PreferencesState>()(
  immer((set, get) => ({
    preferences: null,
    isLoading: false,
    error: null,

    loadPreferences: async () => {
      // Prevent duplicate requests if already loading or already loaded
      if (isLoadingPreferences || get().preferences) {
        return;
      }

      isLoadingPreferences = true;
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await fetch('/api/user/preferences');
        if (response.ok) {
          const data = await response.json();
          set((state) => {
            state.preferences = data.preferences;
            state.isLoading = false;
          });
        } else {
          const errorText = await response.text();
          throw new Error(`Failed to load preferences: ${errorText}`);
        }
      } catch (error: any) {
        console.error('Error loading preferences:', error);
        set((state) => {
          state.isLoading = false;
          state.error = error.message;
        });
      } finally {
        isLoadingPreferences = false;
      }
    },
  }))
);

// Function to get preferences outside of a React component
export const getPreferences = () => usePreferencesStore.getState().preferences; 