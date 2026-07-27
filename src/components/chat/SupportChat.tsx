"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Message = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Renders message content with clickable links.
 * Converts URLs and internal paths (like /onboarding) to anchor tags.
 * Also handles basic markdown bold (**text**).
 */
function renderMessageContent(content: string) {
  // Escape HTML to prevent XSS
  const escaped = content
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">");

  // Convert markdown bold **text** to <strong>
  let html = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert markdown links [text](url) to <a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-medium hover:text-blue-800">$1</a>');

  // Convert bare URLs to links
  html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-medium hover:text-blue-800">$1</a>');

  // Convert internal paths like /onboarding to links
  html = html.replace(/(\/[a-zA-Z0-9\-_/]+)/g, '<a href="$1" class="text-blue-600 underline font-medium hover:text-blue-800">$1</a>');

  // Convert newlines to <br>
  html = html.replace(/\n/g, "<br/>");

  // Convert bullet points (•) with proper spacing
  html = html.replace(/• /g, "&bull; ");

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function SupportChat({
  isOpen,
  setIsOpen,
  showBadge = false
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  showBadge?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi there! 👋 I'm the Neerzy AI agent. Have questions about our pricing, free trial, or features? Ask away!" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user" as const, content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!res.ok) throw new Error("Failed to get response");
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: "Oops! My circuits got a bit tangled. Please try messaging again or contact support@neerzy.com." }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
      >
        <MessageSquare className="h-6 w-6 group-hover:animate-pulse" />
        {showBadge && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] max-h-[520px] bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] rounded-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-10 fade-in zoom-in-95 duration-400">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-white border-b border-blue-700/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-blue-600 rounded-full"></div>
          </div>
          <div>
            <h3 className="font-bold text-sm">Product Expert AI</h3>
            <p className="text-[10px] text-blue-100 uppercase tracking-widest font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Online
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-blue-100 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 p-4 overflow-y-auto bg-slate-50/50 flex flex-col gap-4" style={{ maxHeight: "380px" }}>
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}
          >
            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-sm shadow-sm' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm'
            }`}>
              {renderMessageContent(msg.content)}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start animate-in slide-in-from-bottom-2 fade-in">
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100">
        <form 
          className="relative flex items-center"
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="w-full bg-slate-100 border-none rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-800 placeholder:text-slate-400"
            disabled={isTyping}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-1.5 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 shadow-sm"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
