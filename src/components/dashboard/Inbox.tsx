"use client";

import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Smile, Paperclip, Loader2, CheckCircle2, Mic, StopCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  isVoice?: boolean;
  status?: "preview" | "published";
  timestamp: Date;
}

export function Inbox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hi! I'm your SEO assistant. Ready to update your website? Just tell me what you did today or upload a photo of your latest job. You can also send a voice note!",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    
    // Simulate Transcription
    setIsGenerating(true);
    setTimeout(() => {
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        isVoice: true,
        content: "[Voice Note Transcribed]: Just finished a water heater installation in North Austin. High efficiency Rheem model.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg]);
      
      // Simulate AI response to the voice note
      setTimeout(() => {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          status: "preview",
          content: `I've processed your voice note and generated an update: \n\n**Title:** "Professional Rheem Water Heater Installation in North Austin"\n**Description:** Our licensed team completed a move-in ready high-efficiency water heater installation today. Energy savings confirmed.\n\nReady to go live?`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsGenerating(false);
      }, 1000);
    }, 1500);
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsGenerating(true);

    // Simulate AI Generation
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        status: "preview",
        content: `I've generated a new SEO update for you: \n\n**Title:** "Emergency Pipe Leak Repair in Austin"\n**Description:** Our team quickly resolved a critical pipe burst in a residential bathroom, preventing water damage and restoring service in under 2 hours.\n\nShould I publish this to your website and Google profile?`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsGenerating(false);
    }, 1500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[500px] border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
            }`}>
              {msg.isVoice && (
                <div className="flex items-center gap-2 mb-2 text-blue-200">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Voice Note</span>
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
              
              {msg.status === "preview" && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs font-bold">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Approve & Publish
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-slate-200">
                    Edit Text
                  </Button>
                </div>
              )}
              
              <div className={`text-[10px] mt-2 opacity-60 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-xs font-medium">AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="relative flex items-end gap-2 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          
          {!isRecording ? (
            <>
              <div className="flex gap-1 mb-1 px-1">
                 <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-white rounded-lg transition-colors">
                   <ImageIcon className="w-5 h-5" />
                 </button>
                 <button 
                   onClick={startRecording}
                   className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                 >
                   <Mic className="w-5 h-5" />
                 </button>
              </div>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe your latest job..."
                className="flex-1 bg-transparent border-0 focus:ring-0 text-sm resize-none py-2 px-1 min-h-[40px] max-h-[120px] text-slate-800 placeholder:text-slate-400"
                rows={1}
              />
              
              <Button 
                onClick={handleSend}
                disabled={!input.trim() || isGenerating}
                className="rounded-xl h-10 w-10 p-0 bg-blue-600 hover:bg-blue-700 shrink-0 mb-0.5"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-between p-2 px-4 bg-red-50 rounded-xl animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-bold text-red-600 tracking-tight">Recording... {formatTime(recordingTime)}</span>
              </div>
              <button 
                onClick={stopRecording}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-sm"
              >
                <StopCircle className="w-4 h-4" /> Stop & Transcribe
              </button>
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          The AI will automatically generate a website post and Google update from your message or voice note.
        </p>
      </div>
    </div>
  );
}
