import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface UIState {
  // Dialog states
  searchDialogOpen: boolean;
  exportDialogOpen: boolean;
  shareDialogOpen: boolean;
  settingsDialogOpen: boolean;
  activeSettingsTab: string;

  // Actions
  // Dialogs
  openSearchDialog: () => void;
  closeSearchDialog: () => void;
  openExportDialog: () => void;
  closeExportDialog: () => void;
  openShareDialog: () => void;
  closeShareDialog: () => void;
  openSettingsDialog: (tab?: string) => void;
  closeSettingsDialog: () => void;

  // Settings
  setActiveSettingsTab: (tab: string) => void;
  
  showSidebar: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    immer((set) => ({
      // Initial state
      searchDialogOpen: false,
      exportDialogOpen: false,
      shareDialogOpen: false,
      settingsDialogOpen: false,
      activeSettingsTab: 'profile',
      showSidebar: true,

      // Dialog actions
      openSearchDialog: () => {
        set((state) => {
          state.searchDialogOpen = true;
        });
      },

      closeSearchDialog: () => {
        set((state) => {
          state.searchDialogOpen = false;
        });
      },

      openExportDialog: () => {
        set((state) => {
          state.exportDialogOpen = true;
        });
      },

      closeExportDialog: () => {
        set((state) => {
          state.exportDialogOpen = false;
        });
      },

      openShareDialog: () => {
        set((state) => {
          state.shareDialogOpen = true;
        });
      },

      closeShareDialog: () => {
        set((state) => {
          state.shareDialogOpen = false;
        });
      },

      openSettingsDialog: (tab = 'profile') => {
        set((state) => {
          state.settingsDialogOpen = true;
          state.activeSettingsTab = tab;
        });
      },

      closeSettingsDialog: () => {
        set((state) => {
          state.settingsDialogOpen = false;
        });
      },

      setActiveSettingsTab: (tab: string) => {
        set((state) => {
          state.activeSettingsTab = tab;
        });
      },
      
      toggleSidebar: () => {
        set((state) => {
          state.showSidebar = !state.showSidebar;
        });
      },
    })),
    {
      name: 'kepler-ui-state',
      storage: createJSONStorage(() => localStorage),
      // Only persist UI preferences, not transient states
      partialize: (state) => ({
        activeSettingsTab: state.activeSettingsTab,
        showSidebar: state.showSidebar,
      }),
    }
  )
);