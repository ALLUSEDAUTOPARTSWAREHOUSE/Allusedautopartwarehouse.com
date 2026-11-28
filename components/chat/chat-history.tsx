'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChatSession, chatStorage } from '@/lib/chat-storage';
import { Trash2, Download, Search, ChevronRight, FileJson, FileText } from 'lucide-react';
import Link from 'next/link';

export function ChatHistory() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name'>('recent');

  const loadChats = useCallback(() => {
    const allChats = chatStorage.getAllChats();
    setChats(allChats);
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const filteredChats = searchQuery
    ? chatStorage.searchChats(searchQuery)
    : chats;

  const sortedChats = [...filteredChats].sort((a, b) => {
    if (sortBy === 'recent') return b.updatedAt - a.updatedAt;
    if (sortBy === 'oldest') return a.updatedAt - b.updatedAt;
    return a.title.localeCompare(b.title);
  });

  const handleDeleteChat = (chatId: string) => {
    if (confirm('Delete this chat permanently?')) {
      chatStorage.deleteChat(chatId);
      loadChats();
    }
  };

  const handleExportChat = (chat: ChatSession, format: 'json' | 'markdown') => {
    let content = '';
    let filename = '';

    if (format === 'json') {
      content = JSON.stringify([chat], null, 2);
      filename = `${chat.title}.json`;
    } else {
      let markdown = `# ${chat.title}\n\n`;
      markdown += `*Created: ${new Date(chat.createdAt).toLocaleString()}*\n\n`;
      chat.messages.forEach(msg => {
        const role = msg.role === 'user' ? '👤 You' : '🤖 Assistant';
        markdown += `**${role}:** ${msg.content}\n\n`;
      });
      content = markdown;
      filename = `${chat.title}.md`;
    }

    downloadFile(content, filename, format === 'json' ? 'application/json' : 'text/markdown');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = (format: 'json' | 'markdown') => {
    let content = '';
    let filename = `all-chats-${new Date().toISOString().split('T')[0]}.${format === 'json' ? 'json' : 'md'}`;

    if (format === 'json') {
      content = JSON.stringify(chats, null, 2);
    } else {
      let markdown = '# All Chat History\n\n';
      chats.forEach(chat => {
        markdown += `## ${chat.title}\n`;
        markdown += `*Created: ${new Date(chat.createdAt).toLocaleString()}*\n\n`;
        chat.messages.forEach(msg => {
          const role = msg.role === 'user' ? '👤 You' : '🤖 Assistant';
          markdown += `**${role}:** ${msg.content}\n\n`;
        });
        markdown += '---\n\n';
      });
      content = markdown;
    }

    downloadFile(content, filename, format === 'json' ? 'application/json' : 'text/markdown');
  };

  const handleClearAll = () => {
    if (confirm('Delete ALL chats permanently? This cannot be undone.')) {
      chatStorage.clearAllChats();
      loadChats();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chat History</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{chats.length} conversations</p>
            </div>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              Back to Chat
            </Link>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'oldest' | 'name')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {chats.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleExportAll('json')}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                <FileJson className="w-4 h-4" />
                Export All (JSON)
              </button>
              <button
                onClick={() => handleExportAll('markdown')}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Export All (MD)
              </button>
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sortedChats.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No chats found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery ? 'Try a different search' : 'Start chatting to build your history'}
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Start a Chat
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedChats.map((chat) => (
              <div
                key={chat.id}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <Link href={`/chat?id=${chat.id}`} className="flex-1 min-w-0 hover:opacity-75 transition-opacity">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {chat.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span>{chat.messages.length} messages</span>
                      <span>•</span>
                      <span>Created {new Date(chat.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Updated {new Date(chat.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportChat(chat, 'json')}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      title="Export as JSON"
                    >
                      <FileJson className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleExportChat(chat, 'markdown')}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                      title="Export as Markdown"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteChat(chat.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
