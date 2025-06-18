"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createNewChat } from "@/app/actions";
import { useUIStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";
import type { Chat } from "@/lib/db/types";

interface ChatSidebarProps {
  selectedChatId?: string;
  className?: string;
}

export function ChatSidebar({ selectedChatId, className }: ChatSidebarProps) {
  const router = useRouter();
  const { openSettingsDialog } = useUIStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/chat");
        if (response.ok) {
          const data = await response.json();
          setChats(data.chats);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChats();
  }, []);

  const handleNewChat = async () => {
    const newChat = await createNewChat();
    router.push(`/chat/${newChat.id}`);
  };

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = (chat: any) => (
    <Link href={`/chat/${chat.id}`} key={chat.id} passHref>
      <div
        className={cn(
          "p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
          selectedChatId === chat.id
            ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
            : ""
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">{chat.title}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {chat.lastMessageAt
                ? new Date(chat.lastMessageAt).toLocaleDateString()
                : "No messages"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );

  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4",
          className
        )}
      >
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Chats</h2>
          <div className="flex items-center space-x-2">
            <Button onClick={handleNewChat} size="sm" className="h-8 w-8 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredChats.length > 0 ? (
          filteredChats.map(renderChatItem)
        ) : (
          <p className="text-sm text-gray-500 text-center">No chats found.</p>
        )}
      </div>
    </div>
  );
}
