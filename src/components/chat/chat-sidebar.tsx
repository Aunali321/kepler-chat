'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Folder, Archive, Pin, MoreHorizontal, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatDataStore, initializeChatData } from '@/lib/stores/chat-data-store';

interface ChatSidebarProps {
  selectedChatId?: string;
}

export function ChatSidebar({ selectedChatId }: ChatSidebarProps) {
  const router = useRouter();
  
  // Chat data store
  const {
    organizedChats,
    folders,
    searchQuery,
    expandedFolders,
    isLoading,
    showCreateFolder,
    newFolderName,
    loadData,
    setSearchQuery,
    performSearch,
    toggleFolder,
    createFolder,
    setShowCreateFolder,
    setNewFolderName,
    resetCreateFolderForm,
  } = useChatDataStore();

  useEffect(() => {
    initializeChatData();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      performSearch(query);
    }
  };

  const handleCreateFolder = async () => {
    const success = await createFolder(newFolderName);
    if (!success) {
      console.error('Failed to create folder');
    }
  };

  const handleChatSelect = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleNewChat = () => {
    router.push('/chat');
  };

  const renderChatItem = (chat: any) => (
    <div
      key={chat.id}
      className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
        selectedChatId === chat.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
      }`}
      onClick={() => handleChatSelect(chat.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{chat.title}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleDateString() : 'No messages'}
          </p>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {chat.isPinned && <Pin className="w-4 h-4 text-blue-500" />}
          {chat.isArchived && <Archive className="w-4 h-4 text-gray-500" />}
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4" style={{ width: 'var(--sidebar-width)' }}>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full" style={{ width: 'var(--sidebar-width)' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Chats</h2>
          <Button onClick={handleNewChat} size="sm" className="h-8 w-8 p-0">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Pinned Chats */}
        {organizedChats?.pinned && organizedChats.pinned.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
              <Pin className="w-4 h-4 mr-2" />
              Pinned
            </h3>
            <div className="space-y-1">
              {organizedChats.pinned.map(renderChatItem)}
            </div>
          </div>
        )}

        {/* Folders Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Folders
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowCreateFolder(true)}
            >
              <FolderPlus className="w-4 h-4" />
            </Button>
          </div>

          {/* Create Folder Form */}
          {showCreateFolder && (
            <div className="mb-3 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex space-x-2">
                <Input
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                  className="text-sm"
                  autoFocus
                />
                <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetCreateFolderForm}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Folder List */}
          {folders.map((folder) => {
            const folderChats = organizedChats?.folders[folder.id] || [];
            const isExpanded = expandedFolders.has(folder.id);
            
            return (
              <div key={folder.id}>
                <div
                  className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => toggleFolder(folder.id)}
                >
                  <div className="flex items-center">
                    <Folder 
                      className="w-4 h-4 mr-2" 
                      style={{ color: folder.color || '#6366f1' }}
                    />
                    <span className="text-sm font-medium">{folder.name}</span>
                    <span className="text-xs text-gray-500 ml-2">({folderChats.length})</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </div>
                
                {isExpanded && folderChats.length > 0 && (
                  <div className="ml-6 space-y-1 mt-1">
                    {folderChats.map(renderChatItem)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Uncategorized Chats */}
        {organizedChats?.uncategorized && organizedChats.uncategorized.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Recent
            </h3>
            <div className="space-y-1">
              {organizedChats.uncategorized.map(renderChatItem)}
            </div>
          </div>
        )}

        {/* Archived Chats */}
        {organizedChats?.archived && organizedChats.archived.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
              <Archive className="w-4 h-4 mr-2" />
              Archived ({organizedChats.archived.length})
            </h3>
            <div className="space-y-1">
              {organizedChats.archived.map(renderChatItem)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}