'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChatSession, Message, chatStorage } from '@/lib/chat-storage';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { ChatSidebar } from './chat-sidebar';
import { MoreVertical, Download, Trash2 } from 'lucide-react';

interface ChatContainerProps {
  initialChatId?: string;
}

export function ChatContainer({ initialChatId }: ChatContainerProps) {
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const createNewChat = useCallback(() => {
    const newChat = chatStorage.createChat('New Chat');
    setCurrentChat(newChat);
  }, []);

  useEffect(() => {
    const idToUse = initialChatId || chatStorage.getCurrentChatId();
    if (idToUse) {
      const chat = chatStorage.getChat(idToUse);
      if (chat) {
        setCurrentChat(chat);
        chatStorage.setCurrentChatId(idToUse);
        return;
      }
    }
    createNewChat();
  }, [initialChatId, createNewChat]);

  const handleChatSelect = (chatId: string) => {
    const chat = chatStorage.getChat(chatId);
    if (chat) {
      setCurrentChat(chat);
      chatStorage.setCurrentChatId(chatId);
    }
  };

  const handleSendMessage = useCallback(
    async (userMessage: string) => {
      if (!currentChat) return;

      // Add user message
      const userMsg: Message = {
        id: `msg_${Date.now()}`,
        content: userMessage,
        role: 'user',
        timestamp: Date.now(),
      };

      const updatedChat = { ...currentChat };
      updatedChat.messages.push(userMsg);
      chatStorage.addMessage(currentChat.id, userMsg);

      // Update title if it's still "New Chat"
      if (updatedChat.title === 'New Chat' && updatedChat.messages.length === 1) {
        updatedChat.title = userMessage.slice(0, 50);
        chatStorage.saveChat(updatedChat);
      }

      setCurrentChat(updatedChat);

      // Auto-generate title from first message if needed
      if (updatedChat.messages.length === 1) {
        const titlePreview = userMessage.slice(0, 40);
        updatedChat.title = titlePreview.length < userMessage.length ? titlePreview + '...' : titlePreview;
        chatStorage.saveChat(updatedChat);
      }

      setIsLoading(true);

      try {
        // Call the API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedChat.messages.map(m => ({ role: m.role, content: m.content })),
          }),
        });

        if (!response.ok) throw new Error('Failed to get response');

        let assistantMessage = '';
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          assistantMessage += chunk;
        }

        // Add assistant message
        const assistantMsg: Message = {
          id: `msg_${Date.now()}`,
          content: assistantMessage || 'Sorry, I encountered an error. Please try again.',
          role: 'assistant',
          timestamp: Date.now(),
        };

        chatStorage.addMessage(currentChat.id, assistantMsg);
        updatedChat.messages.push(assistantMsg);
        setCurrentChat(updatedChat);
      } catch (error) {
        console.error('Chat error:', error);
        
        const errorMsg: Message = {
          id: `msg_${Date.now()}`,
          content: 'Sorry, I encountered an error. Please try again.',
          role: 'assistant',
          timestamp: Date.now(),
        };
        chatStorage.addMessage(currentChat.id, errorMsg);
        updatedChat.messages.push(errorMsg);
        setCurrentChat(updatedChat);
      } finally {
        setIsLoading(false);
      }
    },
    [currentChat]
  );

  const handleExportJSON = () => {
    if (!currentChat) return;
    const json = JSON.stringify([currentChat], null, 2);
    downloadFile(json, `${currentChat.title}.json`, 'application/json');
  };

  const handleExportMarkdown = () => {
    if (!currentChat) return;
    let markdown = `# ${currentChat.title}\n\n`;
    currentChat.messages.forEach(msg => {
      const role = msg.role === 'user' ? '👤 You' : '🤖 Assistant';
      markdown += `**${role}:** ${msg.content}\n\n`;
    });
    downloadFile(markdown, `${currentChat.title}.md`, 'text/markdown');
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

  const handleClearChat = () => {
    if (!currentChat) return;
    if (confirm('Are you sure you want to clear this chat?')) {
      const newChat = chatStorage.createChat('New Chat');
      setCurrentChat(newChat);
    }
  };

  const handleDeleteChat = () => {
    if (!currentChat) return;
    if (confirm('Are you sure you want to delete this chat permanently?')) {
      chatStorage.deleteChat(currentChat.id);
      createNewChat();
    }
  };

  if (!currentChat) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      {/* Sidebar */}
      <ChatSidebar
        onChatSelect={handleChatSelect}
        onNewChat={createNewChat}
        currentChatId={currentChat.id}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {currentChat.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {currentChat.messages.length} messages
            </p>
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={() => {
                    handleExportJSON();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export as JSON
                </button>
                <button
                  onClick={() => {
                    handleExportMarkdown();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export as Markdown
                </button>
                <button
                  onClick={() => {
                    handleClearChat();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Chat
                </button>
                <button
                  onClick={() => {
                    handleDeleteChat();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 border-t border-gray-200 dark:border-gray-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Chat
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Messages Area */}
        <MessageList messages={currentChat.messages} isLoading={isLoading} />

        {/* Input Area */}
        <ChatInput onSubmit={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
