'use client';

import { ChatSession, chatStorage } from '@/lib/chat-storage';
import { Trash2, Plus, ChevronRight, Search } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

interface ChatSidebarProps {
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  currentChatId?: string;
}

export function ChatSidebar({ onChatSelect, onNewChat, currentChatId }: ChatSidebarProps) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  const loadChats = useCallback(() => {
    const allChats = chatStorage.getAllChats();
    setChats(allChats);
  }, []);

  useEffect(() => {
    loadChats();
    // Listen for storage changes
    const handleStorageChange = () => {
      loadChats();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadChats]);

  const filteredChats = searchQuery
    ? chatStorage.searchChats(searchQuery)
    : chats;

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    chatStorage.deleteChat(chatId);
    loadChats();
    if (currentChatId === chatId) {
      onNewChat();
    }
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed left-4 top-20 z-30 p-2 bg-blue-600 text-white rounded-lg"
      >
        <ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform fixed md:relative top-16 md:top-0 left-0 h-[calc(100vh-4rem)] md:h-full w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-20 shadow-lg md:shadow-none`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => {
              onNewChat();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              {searchQuery ? 'No chats found' : 'No chats yet. Start one!'}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    onChatSelect(chat.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors group flex items-center justify-between ${
                    currentChatId === chat.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{chat.title}</p>
                    <p className={`text-xs ${
                      currentChatId === chat.id
                        ? 'text-blue-100'
                        : 'text-gray-500 dark:text-gray-400'
                    } truncate`}>
                      {chat.messages.length} messages
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      currentChatId === chat.id
                        ? 'hover:bg-red-600'
                        : 'hover:bg-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 bg-black/50 z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
