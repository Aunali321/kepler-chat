import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Chat, ChatFolder, ChatTag, OrganizedChats } from '@/lib/db/types';

export interface ChatDataState {
  // Data
  organizedChats: OrganizedChats | null;
  folders: ChatFolder[];
  tags: ChatTag[];
  searchQuery: string;
  searchResults: Chat[] | null;
  
  // UI State
  expandedFolders: Set<string>;
  isLoading: boolean;
  isSearching: boolean;
  
  // Create folder form
  showCreateFolder: boolean;
  newFolderName: string;
  
  // Actions - Data Management
  loadData: () => Promise<void>;
  loadChats: () => Promise<void>;
  loadFolders: () => Promise<void>;
  loadTags: () => Promise<void>;
  
  // Actions - Search
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  
  // Actions - Folder Management
  toggleFolder: (folderId: string) => void;
  setFolderExpanded: (folderId: string, expanded: boolean) => void;
  createFolder: (name: string) => Promise<boolean>;
  updateFolder: (folderId: string, updates: Partial<ChatFolder>) => Promise<boolean>;
  deleteFolder: (folderId: string) => Promise<boolean>;
  
  // Actions - Create Folder Form
  setShowCreateFolder: (show: boolean) => void;
  setNewFolderName: (name: string) => void;
  resetCreateFolderForm: () => void;
  
  // Actions - Chat Management
  updateChatInState: (chatId: string, updates: Partial<Chat>) => void;
  removeChatFromState: (chatId: string) => void;
  
  // Utility Actions
  refreshData: () => Promise<void>;
  resetState: () => void;
}

// Track loading states to prevent duplicate requests
let isLoadingData = false;
let hasLoadedInitialData = false;

export const useChatDataStore = create<ChatDataState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      organizedChats: null,
      folders: [],
      tags: [],
      searchQuery: '',
      searchResults: null,
      expandedFolders: new Set<string>(),
      isLoading: false,
      isSearching: false,
      showCreateFolder: false,
      newFolderName: '',

      // Load all data
      loadData: async () => {
        if (isLoadingData) return;
        
        isLoadingData = true;
        set((state) => {
          state.isLoading = true;
        });

        try {
          const [chatsRes, foldersRes, tagsRes] = await Promise.all([
            fetch('/api/chat/organize'),
            fetch('/api/chat/folders'),
            fetch('/api/chat/tags'),
          ]);

          const updates: Partial<ChatDataState> = {};

          if (chatsRes.ok) {
            const chatsData = await chatsRes.json();
            updates.organizedChats = chatsData;
          }

          if (foldersRes.ok) {
            const foldersData = await foldersRes.json();
            updates.folders = foldersData.folders || [];
          }

          if (tagsRes.ok) {
            const tagsData = await tagsRes.json();
            updates.tags = tagsData.tags || [];
          }

          set((state) => {
            Object.assign(state, updates);
            state.isLoading = false;
          });

          hasLoadedInitialData = true;
        } catch (error) {
          console.error('Error loading sidebar data:', error);
          set((state) => {
            state.isLoading = false;
          });
        } finally {
          isLoadingData = false;
        }
      },

      // Load chats only
      loadChats: async () => {
        try {
          const response = await fetch('/api/chat/organize');
          if (response.ok) {
            const data = await response.json();
            set((state) => {
              state.organizedChats = data;
            });
          }
        } catch (error) {
          console.error('Error loading chats:', error);
        }
      },

      // Load folders only
      loadFolders: async () => {
        try {
          const response = await fetch('/api/chat/folders');
          if (response.ok) {
            const data = await response.json();
            set((state) => {
              state.folders = data.folders || [];
            });
          }
        } catch (error) {
          console.error('Error loading folders:', error);
        }
      },

      // Load tags only
      loadTags: async () => {
        try {
          const response = await fetch('/api/chat/tags');
          if (response.ok) {
            const data = await response.json();
            set((state) => {
              state.tags = data.tags || [];
            });
          }
        } catch (error) {
          console.error('Error loading tags:', error);
        }
      },

      // Search actions
      setSearchQuery: (query) => {
        set((state) => {
          state.searchQuery = query;
          if (!query.trim()) {
            state.searchResults = null;
          }
        });
      },

      performSearch: async (query) => {
        if (!query.trim()) {
          get().clearSearch();
          return;
        }

        set((state) => {
          state.isSearching = true;
          state.searchQuery = query;
        });

        try {
          const response = await fetch(`/api/chat/search?query=${encodeURIComponent(query)}`);
          if (response.ok) {
            const results = await response.json();
            set((state) => {
              state.searchResults = results;
              state.isSearching = false;
            });
          }
        } catch (error) {
          console.error('Search error:', error);
          set((state) => {
            state.isSearching = false;
          });
        }
      },

      clearSearch: () => {
        set((state) => {
          state.searchQuery = '';
          state.searchResults = null;
          state.isSearching = false;
        });
      },

      // Folder actions
      toggleFolder: (folderId) => {
        set((state) => {
          if (state.expandedFolders.has(folderId)) {
            state.expandedFolders.delete(folderId);
          } else {
            state.expandedFolders.add(folderId);
          }
        });
      },

      setFolderExpanded: (folderId, expanded) => {
        set((state) => {
          if (expanded) {
            state.expandedFolders.add(folderId);
          } else {
            state.expandedFolders.delete(folderId);
          }
        });
      },

      createFolder: async (name) => {
        if (!name.trim()) return false;

        try {
          const response = await fetch('/api/chat/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim() }),
          });

          if (response.ok) {
            const data = await response.json();
            set((state) => {
              state.folders.push(data.folder);
              state.showCreateFolder = false;
              state.newFolderName = '';
            });
            return true;
          }
        } catch (error) {
          console.error('Error creating folder:', error);
        }
        return false;
      },

      updateFolder: async (folderId, updates) => {
        try {
          const response = await fetch(`/api/chat/folders/${folderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });

          if (response.ok) {
            const data = await response.json();
            set((state) => {
              const index = state.folders.findIndex(f => f.id === folderId);
              if (index !== -1) {
                state.folders[index] = data.folder;
              }
            });
            return true;
          }
        } catch (error) {
          console.error('Error updating folder:', error);
        }
        return false;
      },

      deleteFolder: async (folderId) => {
        try {
          const response = await fetch(`/api/chat/folders/${folderId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            set((state) => {
              state.folders = state.folders.filter(f => f.id !== folderId);
              state.expandedFolders.delete(folderId);
              // Also remove from organized chats if present
              if (state.organizedChats?.folders) {
                delete state.organizedChats.folders[folderId];
              }
            });
            return true;
          }
        } catch (error) {
          console.error('Error deleting folder:', error);
        }
        return false;
      },

      // Create folder form actions
      setShowCreateFolder: (show) => {
        set((state) => {
          state.showCreateFolder = show;
          if (!show) {
            state.newFolderName = '';
          }
        });
      },

      setNewFolderName: (name) => {
        set((state) => {
          state.newFolderName = name;
        });
      },

      resetCreateFolderForm: () => {
        set((state) => {
          state.showCreateFolder = false;
          state.newFolderName = '';
        });
      },

      // Chat management
      updateChatInState: (chatId, updates) => {
        set((state) => {
          if (!state.organizedChats) return;
          
          // Update chat in all relevant arrays
          const updateChatInArray = (chats: Chat[]) => {
            const index = chats.findIndex(c => c.id === chatId);
            if (index !== -1) {
              Object.assign(chats[index], updates);
            }
          };

          updateChatInArray(state.organizedChats.pinned);
          updateChatInArray(state.organizedChats.uncategorized);
          updateChatInArray(state.organizedChats.archived);
          
          // Update in folders
          Object.values(state.organizedChats.folders).forEach(updateChatInArray);
        });
      },

      removeChatFromState: (chatId) => {
        set((state) => {
          if (!state.organizedChats) return;
          
          // Remove chat from all arrays
          const removeChatFromArray = (chats: Chat[]) => {
            return chats.filter(c => c.id !== chatId);
          };

          state.organizedChats.pinned = removeChatFromArray(state.organizedChats.pinned);
          state.organizedChats.uncategorized = removeChatFromArray(state.organizedChats.uncategorized);
          state.organizedChats.archived = removeChatFromArray(state.organizedChats.archived);
          
          // Remove from folders
          Object.keys(state.organizedChats.folders).forEach(folderId => {
            state.organizedChats!.folders[folderId] = removeChatFromArray(state.organizedChats!.folders[folderId]);
          });
        });
      },

      // Utility actions
      refreshData: async () => {
        await get().loadData();
      },

      resetState: () => {
        set((state) => {
          state.organizedChats = null;
          state.folders = [];
          state.tags = [];
          state.searchQuery = '';
          state.searchResults = null;
          state.expandedFolders = new Set();
          state.isLoading = false;
          state.isSearching = false;
          state.showCreateFolder = false;
          state.newFolderName = '';
        });
        hasLoadedInitialData = false;
      },
    })),
    {
      name: 'kepler-chat-data',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist user preferences and UI state, but not heavy data
        expandedFolders: Array.from(state.expandedFolders), // Convert Set to Array for JSON
        searchQuery: state.searchQuery,
      }),
      // Custom serialization for Set
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert array back to Set
          state.expandedFolders = new Set(state.expandedFolders as unknown as string[]);
        }
      },
    }
  )
);

// Initialize data loading when needed
export const initializeChatData = () => {
  if (!hasLoadedInitialData && typeof window !== 'undefined') {
    useChatDataStore.getState().loadData();
  }
};