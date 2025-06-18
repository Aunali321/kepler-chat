import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { usePreferencesStore } from './preferences-store';
import type { UISettings } from './settings-store';

export interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  sidebarWidth: 'narrow' | 'normal' | 'wide';
  
  // Typography settings
  fontSize: 'small' | 'medium' | 'large';
  
  // Mobile detection
  isMobile: boolean;
  
  // Dialog states
  searchDialogOpen: boolean;
  shareDialogOpen: boolean;
  exportDialogOpen: boolean;
  settingsDialogOpen: boolean;
  createFolderDialogOpen: boolean;
  
  // Chat interface states
  selectedChatId: string | null;
  expandedFolders: string[];
  
  // Loading states
  isInitializing: boolean;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: 'narrow' | 'normal' | 'wide') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleSidebar: () => void;
  setIsMobile: (mobile: boolean) => void;
  initializeFromPreferences: () => void;
  
  // Dialog actions
  openSearchDialog: () => void;
  closeSearchDialog: () => void;
  openShareDialog: () => void;
  closeShareDialog: () => void;
  openExportDialog: () => void;
  closeExportDialog: () => void;
  openSettingsDialog: () => void;
  closeSettingsDialog: () => void;
  openCreateFolderDialog: () => void;
  closeCreateFolderDialog: () => void;
  closeAllDialogs: () => void;
  
  // Chat actions
  setSelectedChatId: (chatId: string | null) => void;
  toggleFolderExpanded: (folderId: string) => void;
  setFolderExpanded: (folderId: string, expanded: boolean) => void;
  
  // Initialization
  initialize: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      sidebarWidth: 'normal',
      fontSize: 'medium',
      isMobile: false,
      searchDialogOpen: false,
      shareDialogOpen: false,
      exportDialogOpen: false,
      settingsDialogOpen: false,
      createFolderDialogOpen: false,
      selectedChatId: null,
      expandedFolders: [],
      isInitializing: true,

      // Sidebar actions
      setSidebarOpen: (open) => {
        set((state) => {
          state.sidebarOpen = open;
        });
      },

      setSidebarCollapsed: (collapsed) => {
        set((state) => {
          state.sidebarCollapsed = collapsed;
        });
      },

      setSidebarWidth: (width) => {
        set((state) => {
          state.sidebarWidth = width;
        });
      },

      setFontSize: (size) => {
        set((state) => {
          state.fontSize = size;
        });
      },

      toggleSidebar: () => {
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        });
      },

      setIsMobile: (mobile) => {
        set((state) => {
          state.isMobile = mobile;
          // Auto-close sidebar on mobile
          if (mobile) {
            state.sidebarOpen = false;
          }
        });
      },

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

      openSettingsDialog: () => {
        set((state) => {
          state.settingsDialogOpen = true;
        });
      },

      closeSettingsDialog: () => {
        set((state) => {
          state.settingsDialogOpen = false;
        });
      },

      openCreateFolderDialog: () => {
        set((state) => {
          state.createFolderDialogOpen = true;
        });
      },

      closeCreateFolderDialog: () => {
        set((state) => {
          state.createFolderDialogOpen = false;
        });
      },

      closeAllDialogs: () => {
        set((state) => {
          state.searchDialogOpen = false;
          state.shareDialogOpen = false;
          state.exportDialogOpen = false;
          state.settingsDialogOpen = false;
          state.createFolderDialogOpen = false;
        });
      },

      // Chat actions
      setSelectedChatId: (chatId) => {
        set((state) => {
          state.selectedChatId = chatId;
        });
      },

      toggleFolderExpanded: (folderId) => {
        set((state) => {
          const index = state.expandedFolders.indexOf(folderId);
          if (index === -1) {
            state.expandedFolders.push(folderId);
          } else {
            state.expandedFolders.splice(index, 1);
          }
        });
      },

      setFolderExpanded: (folderId, expanded) => {
        set((state) => {
          const index = state.expandedFolders.indexOf(folderId);
          if (expanded && index === -1) {
            state.expandedFolders.push(folderId);
          } else if (!expanded && index !== -1) {
            state.expandedFolders.splice(index, 1);
          }
        });
      },

      // Initialization logic
      initializeFromPreferences: () => {
        const { preferences } = usePreferencesStore.getState();
        if (preferences?.uiSettings) {
          const uiSettings = preferences.uiSettings as UISettings;
          set((state) => {
            if (uiSettings.fontSize) {
              state.fontSize = uiSettings.fontSize;
            }
            if (uiSettings.sidebarWidth) {
              // The type in uiSettings is different from the one in UIState.
              // We can cast it for now. A better solution would be to unify the types.
              state.sidebarWidth = uiSettings.sidebarWidth as 'narrow' | 'normal' | 'wide';
            }
          });
        }
      },

      // Initialization
      initialize: () => {
        set((state) => {
          state.isInitializing = false;
        });
        
        // Auto-detect mobile on initialization
        if (typeof window !== 'undefined') {
          const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            get().setIsMobile(mobile);
          };
          
          checkMobile();
          window.addEventListener('resize', checkMobile);
          
          return () => {
            window.removeEventListener('resize', checkMobile);
          };
        }
      },
    })),
    {
      name: 'kepler-ui-state',
      storage: createJSONStorage(() => localStorage),
      // Only persist UI preferences, not transient states
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        expandedFolders: state.expandedFolders,
        selectedChatId: state.selectedChatId,
      }),
    }
  )
);

// Initialize UI store when the module loads
if (typeof window !== 'undefined') {
  useUIStore.getState().initialize();
}