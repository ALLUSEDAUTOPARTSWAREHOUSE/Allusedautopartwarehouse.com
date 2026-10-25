'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2 } from 'lucide-react';
import { ChatSession, Message, chatStorage } from '@/lib/chat-storage';
import Link from 'next/link';

/** Lightweight markdown renderer for chat bubbles: bold, links, newlines. */
function WidgetMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const renderLine = (line: string, key: number) => {
    const parts = line.split(/(\*\*\[[^\]]+\]\([^)]+\)\*\*|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
    return (
      <span key={key}>
        {parts.map((part, i) => {
          const boldLink = part.match(/^\*\*\[([^\]]+)\]\(([^)]+)\)\*\*$/);
          if (boldLink) return <a key={i} href={boldLink[2]} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:opacity-80"><strong>{boldLink[1]}</strong></a>;
          const bold = part.match(/^\*\*([^*]+)\*\*$/);
          if (bold) return <strong key={i}>{bold[1]}</strong>;
          const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (link) return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:opacity-80">{link[1]}</a>;
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };
  return (
    <span className="whitespace-pre-wrap">
      {lines.map((line, i) => (
        <span key={i}>{renderLine(line, i)}{i < lines.length - 1 && <br />}</span>
      ))}
    </span>
  );
}

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize on mount so the floating button always renders on every page.
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = () => {
    const currentId = chatStorage.getCurrentChatId();
    if (currentId) {
      const chat = chatStorage.getChat(currentId);
      if (chat) {
        setCurrentChat(chat);
        return;
      }
    }
    createNewChat();
  };

  const createNewChat = () => {
    const newChat = chatStorage.createChat();
    setCurrentChat(newChat);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMessage.trim() || !currentChat || isLoading) return;

    const userMsg = userMessage.trim();
    setUserMessage('');
    setIsLoading(true);

    try {
      const updatedChat = chatStorage.addMessage(currentChat.id, {
        role: 'user',
        content: userMsg,
      });
      if (!updatedChat) {
        setIsLoading(false);
        return;
      }
      setCurrentChat(updatedChat);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedChat.messages,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      let assistantMessage = '';
      const decoder = new TextDecoder();

      // Seed an empty assistant message we progressively update as text streams in.
      let chatWithAI = chatStorage.addMessage(currentChat.id, {
        role: 'assistant',
        content: '',
      });
      if (chatWithAI) setCurrentChat(chatWithAI);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantMessage += decoder.decode(value, { stream: true });

        chatWithAI = chatStorage.updateLastMessage(currentChat.id, assistantMessage);
        if (chatWithAI) setCurrentChat({ ...chatWithAI });
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (currentChat && confirm('Clear this chat?')) {
      chatStorage.deleteChat(currentChat.id);
      createNewChat();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 size-14 overflow-hidden rounded-full border border-border bg-black text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center pointer-events-auto"
        aria-label="Open chat"
        style={{ pointerEvents: 'auto' }}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <img
            src="/images/chat-mechanic-avatar.jpg"
            alt=""
            width={56}
            height={56}
            className="size-14 object-cover"
          />
        )}
      </button>

      {/* Chat Widget */}
      {isOpen && currentChat && (
        <div className="fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] max-w-96 h-[min(600px,calc(100vh-8rem))] rounded-lg shadow-2xl bg-background border border-border/50 backdrop-blur-sm flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto" style={{ pointerEvents: 'auto' }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 border-b border-border/30 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/images/chat-mechanic-avatar.jpg"
                alt="AUAPW Assistant"
                width={32}
                height={32}
                className="size-8 rounded-full bg-black object-cover"
              />
              <div>
                <h3 className="font-semibold text-sm">AUAPW AI Assistant</h3>
                <p className="text-xs text-muted-foreground">Auto parts expert</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                className="p-2 hover:bg-background/80 rounded-md transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50">
            {currentChat.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                <img
                  src="/images/chat-mechanic-avatar.jpg"
                  alt="AUAPW"
                  width={64}
                  height={64}
                  className="size-16 rounded-full bg-black object-cover"
                />
                <div>
                  <p className="text-sm font-medium">Welcome to AUAPW!</p>
                  <p className="text-xs text-muted-foreground">Ask me about OEM auto parts, availability, or pricing</p>
                </div>
              </div>
            ) : (
              <>
                {currentChat.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2 rounded-lg text-sm break-words leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-muted text-foreground rounded-bl-none'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      ) : (
                        <WidgetMarkdown text={msg.content || (isLoading ? '...' : '')} />
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground px-4 py-2 rounded-lg rounded-bl-none">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce animation-delay-100" />
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce animation-delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-border/30 p-4 bg-background flex gap-2"
          >
            <input
              type="text"
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Ask about auto parts..."
              className="flex-1 bg-muted border border-border/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !userMessage.trim()}
              className="bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Links */}
          <div className="border-t border-border/30 px-4 py-2 bg-background/50 flex gap-2 justify-center text-xs">
            <Link
              href="/chat"
              className="text-primary hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Full Chat
            </Link>
            <span className="text-border/50">•</span>
            <Link
              href="/chat/history"
              className="text-primary hover:underline"
              onClick={() => setIsOpen(false)}
            >
              History
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
