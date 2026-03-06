import React, { useState, useRef, useEffect } from 'react';
import { Client } from '@gradio/client';
import ChatMessage from '@/components/Chat/ChatMessage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am the Kodemy AI Assistant. How can I help you with your learning today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const client = await Client.connect("Spoidermon29/lms-ai-assistant");
      const result = await client.predict("/respond", {
        message: userMsg,
      });

      const data = result.data;
      let aiText = "Sorry, I couldn't process your request.";

      if (typeof data === 'string') {
        aiText = data;
      } else if (Array.isArray(data) && data.length > 0) {
        aiText = typeof data[0] === 'string' ? data[0] : JSON.stringify(data[0]);
      } else if (data !== null && typeof data === 'object') {
        aiText = JSON.stringify(data);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I'm having trouble connecting to the AI server right now. Please try again in a moment." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1c1d1f] border-b border-gray-800 shadow-sm flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Kodemy AI Assistant</h1>
            <p className="text-xs text-gray-400 -mt-0.5">Powered by Hugging Face Spaces</p>
          </div>
        </div>
        <button 
          onClick={() => window.history.back()} 
          title="Go back"
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="pb-44 pt-4">
          {messages.map((msg, index) => (
            <ChatMessage key={index} role={msg.role} content={msg.content} />
          ))}
          {loading && (
            <div className="py-6 px-4 bg-[#f7f9fa] border-y border-gray-100">
              <div className="max-w-3xl mx-auto flex gap-6">
                <div className="w-8 h-8 rounded-sm bg-[#1c1d1f] flex-shrink-0 flex items-center justify-center font-bold text-white text-xs">
                  AI
                </div>
                <div className="flex-1 flex items-center space-x-2 py-2">
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

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-6 px-4">
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
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask me anything... (Enter to send, Shift+Enter for new line)"
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
  );
}
