'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MessageCircle, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { SearchResults } from '@/lib/db/types';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChatSelect: (chatId: string) => void;
}

export function SearchDialog({ isOpen, onClose, onChatSelect }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/search?query=${encodeURIComponent(searchQuery)}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId);
    onClose();
    setQuery('');
    setResults(null);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 rounded px-1">
          {part}
        </mark>
      ) : part
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search chats and messages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 text-lg h-12"
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {!isLoading && !error && !results && query && (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Start typing to search chats and messages...</p>
            </div>
          )}

          {!isLoading && !error && query && results && (
            <div className="space-y-6">
              {/* Chat Results */}
              {results.chats && results.chats.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chats ({results.chats.length})
                  </h3>
                  <div className="space-y-2">
                    {results.chats.map((chat) => (
                      <Card
                        key={chat.id}
                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleChatSelect(chat.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">
                              {highlightText(chat.title, query)}
                            </h4>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(chat.createdAt!).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Results */}
              {results.messages && results.messages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Messages ({results.messages.length})
                  </h3>
                  <div className="space-y-2">
                    {results.messages.map((message) => (
                      <Card
                        key={message.id}
                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleChatSelect(message.chatId)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              From: {message.chat.title}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <User className="w-4 h-4 mr-1" />
                              {message.role}
                              <Calendar className="w-4 h-4 ml-3 mr-1" />
                              {new Date(message.createdAt!).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-sm">
                            {message.content && (
                              <p className="line-clamp-3">
                                {highlightText(message.content, query)}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {results.chats.length === 0 && results.messages.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No results found for "{query}"</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Try different keywords or check your spelling
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}