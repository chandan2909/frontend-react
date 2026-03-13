import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from '@/components/Chat/ChatMessage';
import useAuthStore from '@/store/authStore';
import apiClient from '@/lib/apiClient';
import { MessageSquarePlus, MessageSquare, Trash2, ArrowLeft, PanelLeft, Trash, Send, Loader2 } from 'lucide-react';

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

const DEFAULT_MSG: Message = {
  role: 'assistant',
  content: 'Hello! I am the Kodemy AI Assistant. How can I help you with your learning today?'
};

function createLocalChat(): Chat {
  return {
    id: crypto.randomUUID(),
    title: 'New Chat',
    messages: [DEFAULT_MSG],
    createdAt: Date.now(),
  };
}

// --- Guest mode helpers (localStorage only) ---
function getGuestKey() { return 'kodemy_guest_chats_v3'; }

function loadGuestChats(): Chat[] {
  try {
    const saved = localStorage.getItem(getGuestKey());
    if (saved) {
      const parsed = JSON.parse(saved) as Chat[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [createLocalChat()];
}

function saveGuestChats(chats: Chat[]) {
  try {
    localStorage.setItem(getGuestKey(), JSON.stringify(chats));
  } catch {}
}
// -----------------------------------------------

export default function ChatbotPage() {
  const { user, isAuthenticated } = useAuthStore();

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId) ?? chats[0];

  // Load chats on mount / user change
  const loadChats = useCallback(async () => {
    if (isAuthenticated && user) {
      setSyncing(true);
      let serverChats: Chat[] = [];

      try {
        const { data } = await apiClient.get('/chats');
        serverChats = data as Chat[];
      } catch {
        // GET failed — fall back to guest chats so user isn't blocked
        const local = loadGuestChats();
        setChats(local);
        setActiveChatId(local[0].id);
        setSyncing(false);
        return;
      }

      // GET succeeded — now decide what to show
      if (serverChats.length === 0) {
        // Bootstrap a fresh chat on the backend
        const fresh = createLocalChat();
        fresh.messages = [DEFAULT_MSG];
        setChats([fresh]);
        setActiveChatId(fresh.id);
        // Attempt to persist; if this fails the upsert in addMessage will self-heal
        try {
          await apiClient.post('/chats', {
            id: fresh.id,
            title: fresh.title,
            createdAt: fresh.createdAt,
            initialMessage: DEFAULT_MSG,
          });
        } catch { /* self-heals on first message via INSERT IGNORE */ }
      } else {
        setChats(serverChats);
        setActiveChatId(serverChats[0].id);
      }

      setSyncing(false);
    } else {
      // Guest mode
      const local = loadGuestChats();
      setChats(local);
      setActiveChatId(local[0].id);
    }
  }, [isAuthenticated, user]);

  // No pre-warming needed for direct fetch
  useEffect(() => {
    // Keep for potential future pre-warming
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Persist guest chats to localStorage
  useEffect(() => {
    if (!isAuthenticated) {
      saveGuestChats(chats);
    }
  }, [chats, isAuthenticated]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, loading]);

  // Handle window resize for sidebar
  useEffect(() => {
    let lastWidth = window.innerWidth;
    const handleResize = () => {
      if (window.innerWidth !== lastWidth) {
        if (window.innerWidth < 768) {
          setSidebarOpen(false);
        } else {
          setSidebarOpen(true);
        }
        lastWidth = window.innerWidth;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Chat actions ---

  const handleNewChat = async () => {
    const newChat = createLocalChat();
    newChat.messages = [DEFAULT_MSG];

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setInput('');

    if (isAuthenticated) {
      try {
        await apiClient.post('/chats', {
          id: newChat.id,
          title: newChat.title,
          createdAt: newChat.createdAt,
          initialMessage: DEFAULT_MSG,
        });
      } catch { /* ignore */ }
    }
  };

  const handleDeleteChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(prev => {
      const remaining = prev.filter(c => c.id !== id);
      if (remaining.length === 0) {
        const fresh = createLocalChat();
        setActiveChatId(fresh.id);
        return [fresh];
      }
      if (activeChatId === id) {
        setActiveChatId(remaining[0].id);
      }
      return remaining;
    });

    if (isAuthenticated) {
      try {
        await apiClient.delete(`/chats/${id}`);
      } catch { /* ignore */ }
    }
  };

  const updateLocalChat = (chatIdToUpdate: string, updater: (chat: Chat) => Chat) => {
    setChats(prev => prev.map(c => c.id === chatIdToUpdate ? updater(c) : c));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const chatId = activeChat?.id;
    if (!chatId) return;

    const isFirstUserMsg = activeChat.messages.length === 1;
    const newTitle = isFirstUserMsg ? userMsg.slice(0, 40) : activeChat.title;
    const now = Date.now();

    updateLocalChat(chatId, chat => ({
      ...chat,
      title: newTitle,
      messages: [...chat.messages, { role: 'user', content: userMsg }],
    }));
    setLoading(true);

    // Persist user message to backend
    if (isAuthenticated) {
      try {
        await apiClient.post(`/chats/${chatId}/messages`, {
          role: 'user',
          content: userMsg,
          createdAt: now,
          title: isFirstUserMsg ? newTitle : undefined,
        });
      } catch { /* ignore, will still work locally */ }
    }

    let aiText = "";

    // Capture history BEFORE adding the empty placeholder, to avoid sending an
    // empty assistant message to Gemini which causes it to return blank responses.
    // activeChat.messages already has all previous messages (including system greeting),
    // but NOT the user message yet (state update is async), so we build it manually.
    const messagesPayload = activeChat.messages
      .map(m => ({ role: m.role, content: m.content }))
      .filter(m => m.content.trim() !== ''); // filter any empty messages

    // Setup initial empty bot message placeholder for UI
    updateLocalChat(chatId, chat => ({
        ...chat,
        messages: [...chat.messages, { role: 'assistant', content: '' }],
    }));

    try {
      const token = useAuthStore.getState().accessToken;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fetchUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/chats/stream` : '/api/chats/stream';

      const streamResponse = await fetch(fetchUrl, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          message: userMsg,
          history: messagesPayload
        })
      });

      if (!streamResponse.ok) {
        throw new Error('Failed to fetch from AI server');
      }

      setLoading(false); // Stop loader as soon as connection is established

      const reader = streamResponse.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // Keep the last part of the buffer (might be an incomplete line)
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }

                const token = data.choices[0]?.delta?.content || "";
                aiText += token;

                // Instantly update the UI with the new token
                updateLocalChat(chatId, chat => {
                  const newChat = { ...chat };
                  const msgs = [...newChat.messages];
                  msgs[msgs.length - 1] = { role: 'assistant', content: aiText };
                  newChat.messages = msgs;
                  return newChat;
                });
              } catch (e) {
                console.error("Error parsing SSE line:", e, "Line:", trimmedLine);
              }
            }
          }
        }
      }
    } catch (e: any) {
      aiText = e.message || "Sorry, I'm having trouble connecting to the AI server right now. Please try again.";
      updateLocalChat(chatId, chat => {
        const newChat = { ...chat };
        const msgs = [...newChat.messages];
        msgs[msgs.length - 1] = { role: 'assistant', content: aiText };
        newChat.messages = msgs;
        return newChat;
      });
    }

    // Persist to backend fire-and-forget
    if (isAuthenticated && aiText) {
      apiClient.post(`/chats/${chatId}/messages`, {
        role: 'assistant',
        content: aiText,
        createdAt: Date.now(),
      }).catch(() => { /* ignore */ });
    }


    // Stop the three-dot loader and start streaming
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex h-[100dvh] bg-white font-sans overflow-hidden relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} absolute md:relative z-30 h-full flex-shrink-0 bg-[#1c1d1f] flex flex-col overflow-hidden transition-all duration-300`}>
        <div className="px-3 pt-4 pb-2 flex items-center justify-between w-64">
          <span className="text-white font-bold text-sm tracking-wide">✨ Kodemy AI</span>
          {syncing && <span className="text-xs text-gray-400 animate-pulse">Syncing...</span>}
        </div>
        <div className="px-3 pb-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 text-sm text-gray-300 border border-white/20 hover:border-white/40 hover:bg-white/10 rounded-lg px-3 py-2 transition-all"
          >
            <MessageSquarePlus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => {
                setActiveChatId(chat.id);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-all w-[232px] ${
                chat.id === activeChatId
                  ? 'bg-white/15 text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60" />
              <span className="flex-1 truncate">{chat.title}</span>
              <button
                onClick={(e) => handleDeleteChat(chat.id, e)}
                title="Delete chat"
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all p-0.5 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        {isAuthenticated && (
          <div className="px-3 pb-2 text-xs text-gray-500 text-center">
            ☁️ Synced to your account
          </div>
        )}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Kodemy
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        <header className="h-14 border-b border-gray-100 flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(p => !p)}
            title="Toggle sidebar"
            className="p-2 text-gray-500 hover:text-[#1c1d1f] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold text-[#1c1d1f] truncate flex-1">{activeChat?.title ?? 'New Chat'}</h1>
          <button
            title="Clear current chat"
            onClick={() => {
              if (!activeChat) return;
              updateLocalChat(activeChat.id, chat => ({ ...chat, title: 'New Chat', messages: [DEFAULT_MSG] }));
            }}
            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1"
          >
            <Trash className="w-4 h-4" />
            Clear
          </button>
        </header>

        <div className="flex-1 overflow-y-auto mb-[72px] md:mb-0">
          <div className="pb-32 md:pb-44 pt-4">
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

        <div
          className={`fixed bottom-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-4 md:pb-6 px-3 md:px-4 transition-all duration-300 ${sidebarOpen ? 'md:left-64 left-0' : 'left-0'}`}
        >
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 bg-white border border-gray-300 rounded-lg md:rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.1)] p-2 focus-within:ring-2 focus-within:ring-[#1c1d1f] focus-within:border-[#1c1d1f] transition-all"
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
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
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
