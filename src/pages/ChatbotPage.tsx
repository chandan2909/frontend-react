import React, { useState, useRef, useEffect } from 'react';
import { Client } from '@gradio/client';
import ChatMessage from '@/components/Chat/ChatMessage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const STORAGE_KEY = 'kodemy_chats_v2';
const DEFAULT_MSG: Message = {
  role: 'assistant',
  content: 'Hello! I am the Kodemy AI Assistant. How can I help you with your learning today?'
};

function createNewChat(): Chat {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [DEFAULT_MSG],
    createdAt: Date.now(),
  };
}

function loadChats(): Chat[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Chat[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [createNewChat()];
}

function saveChats(chats: Chat[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {}
}

export default function ChatbotPage() {
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [activeChatId, setActiveChatId] = useState<string>(() => loadChats()[0].id);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId) ?? chats[0];

  // Persist chats when they change
  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, loading]);

  const updateActiveChat = (updater: (chat: Chat) => Chat) => {
    setChats(prev => prev.map(c => c.id === activeChatId ? updater(c) : c));
  };

  const handleNewChat = () => {
    const newChat = createNewChat();
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInput('');
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(prev => {
      const remaining = prev.filter(c => c.id !== id);
      if (remaining.length === 0) {
        const fresh = createNewChat();
        setActiveChatId(fresh.id);
        return [fresh];
      }
      if (activeChatId === id) {
        setActiveChatId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Auto-title the chat from the first user message
    updateActiveChat(chat => ({
      ...chat,
      title: chat.messages.length === 1 ? userMsg.slice(0, 40) : chat.title,
      messages: [...chat.messages, { role: 'user', content: userMsg }],
    }));
    setLoading(true);

    try {
      const client = await Client.connect("Spoidermon29/lms-ai-assistant");
      const result = await client.predict("/respond", { message: userMsg });
      const data = result.data;
      let aiText = "Sorry, I couldn't process your request.";
      if (typeof data === 'string') {
        aiText = data;
      } else if (Array.isArray(data) && data.length > 0) {
        aiText = typeof data[0] === 'string' ? data[0] : JSON.stringify(data[0]);
      }
      updateActiveChat(chat => ({
        ...chat,
        messages: [...chat.messages, { role: 'assistant', content: aiText }],
      }));
    } catch {
      updateActiveChat(chat => ({
        ...chat,
        messages: [...chat.messages, {
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting to the AI server right now. Please try again."
        }],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-[#1c1d1f] flex flex-col overflow-hidden transition-all duration-300`}>
        {/* Sidebar Header */}
        <div className="px-3 pt-4 pb-2 flex items-center justify-between">
          <span className="text-white font-bold text-sm tracking-wide">✨ Kodemy AI</span>
        </div>
        {/* New Chat Button */}
        <div className="px-3 pb-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 text-sm text-gray-300 border border-white/20 hover:border-white/40 hover:bg-white/10 rounded-lg px-3 py-2 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-all ${
                chat.id === activeChatId
                  ? 'bg-white/15 text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="flex-1 truncate">{chat.title}</span>
              <button
                onClick={(e) => handleDeleteChat(chat.id, e)}
                title="Delete chat"
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-0.5 rounded"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        {/* Back Button at bottom of Sidebar */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Kodemy
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-gray-100 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(p => !p)}
            title="Toggle sidebar"
            className="p-2 text-gray-500 hover:text-[#1c1d1f] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-[#1c1d1f] truncate flex-1">{activeChat?.title ?? 'New Chat'}</h1>
          <button
            title="Clear current chat"
            onClick={() => updateActiveChat(chat => ({ ...chat, title: 'New Chat', messages: [DEFAULT_MSG] }))}
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="pb-44 pt-4">
            {activeChat?.messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
            {loading && (
              <div className="py-6 px-4 bg-[#f7f9fa] border-y border-gray-100">
                <div className="max-w-3xl mx-auto flex gap-6">
                  <div className="w-8 h-8 rounded-sm bg-[#1c1d1f] flex-shrink-0 flex items-center justify-center font-bold text-white text-xs">AI</div>
                  <div className="flex items-center space-x-2 py-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="fixed bottom-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-6 px-4"
          style={{ left: sidebarOpen ? '256px' : '0px', transition: 'left 0.3s' }}>
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 bg-white border border-gray-300 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.1)] p-2 focus-within:ring-2 focus-within:ring-[#1c1d1f] focus-within:border-[#1c1d1f] transition-all"
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
                }}
                placeholder="Ask me anything... (Enter to send)"
                className="flex-1 max-h-48 min-h-[44px] resize-none outline-none bg-transparent px-3 py-3 text-[#1c1d1f] text-sm placeholder:text-gray-400"
                rows={1}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                title="Send message"
                className="p-3 bg-[#1c1d1f] text-white rounded-xl hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>
            <p className="text-center mt-3 text-xs text-gray-400">AI can make mistakes. Consider verifying important information.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
