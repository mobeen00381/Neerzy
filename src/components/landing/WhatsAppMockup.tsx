"use client";

import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  sender: 'trader' | 'neerzy';
  type: 'text' | 'image' | 'card';
  text?: string;
  imageUrl?: string;
  cardContent?: {
    headline: string;
    body: string;
    gbpLink: string;
    dashboardLink: string;
  };
}

interface AnimationStep {
  type: 'typing' | 'message';
  who?: 'trader' | 'neerzy';
  message?: ChatMessage;
  delay: number;
}

export default function WhatsAppMockup() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingFor, setTypingFor] = useState<'trader' | 'neerzy' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const steps: AnimationStep[] = [
    // 1. Trader typing photo/description
    {
      type: 'typing',
      who: 'trader',
      delay: 1800
    },
    {
      type: 'message',
      message: {
        id: 'm1',
        sender: 'trader',
        type: 'image',
        imageUrl: '/images/plumber_job_photo.png',
        text: 'Kitchen sink fixed for Mrs Smith. Clean finish. 📸'
      },
      delay: 1500
    },
    // 2. Neerzy replying photo saved
    {
      type: 'typing',
      who: 'neerzy',
      delay: 2000
    },
    {
      type: 'message',
      message: {
        id: 'm2',
        sender: 'neerzy',
        type: 'text',
        text: '✅ *Photo saved.*\n\nSend more photos or type *POST* when ready.'
      },
      delay: 1500
    },
    // 3. Trader typing customer details
    {
      type: 'typing',
      who: 'trader',
      delay: 2200
    },
    {
      type: 'message',
      message: {
        id: 'm3',
        sender: 'trader',
        type: 'text',
        text: 'Amjad 03711291617'
      },
      delay: 1500
    },
    // 4. Neerzy replying customer details saved
    {
      type: 'typing',
      who: 'neerzy',
      delay: 2000
    },
    {
      type: 'message',
      message: {
        id: 'm4',
        sender: 'neerzy',
        type: 'text',
        text: '✅ *Customer detail saved.*\n\nType *DONE* to send the review link immediately, or send photos/voice notes to create a post.'
      },
      delay: 1500
    },
    // 5. Trader typing POST
    {
      type: 'typing',
      who: 'trader',
      delay: 1200
    },
    {
      type: 'message',
      message: {
        id: 'm5',
        sender: 'trader',
        type: 'text',
        text: 'POST'
      },
      delay: 1500
    },
    // 6. Neerzy replying with google post generated
    {
      type: 'typing',
      who: 'neerzy',
      delay: 2500
    },
    {
      type: 'message',
      message: {
        id: 'm6a',
        sender: 'neerzy',
        type: 'text',
        text: '📸 *Photos are sent above. Tap and save them directly to your phone\'s gallery!*'
      },
      delay: 1000
    },
    {
      type: 'message',
      message: {
        id: 'm6b',
        sender: 'neerzy',
        type: 'card',
        cardContent: {
          headline: 'Job Completed Successfully! 🎉',
          body: 'We\'re excited to announce that Amjad has successfully completed the recent project! Thanks to everyone for their hard work and dedication. Let\'s keep pushing forward together!',
          gbpLink: 'https://www.google.com/search?q=BlackSmith+Door+Handles',
          dashboardLink: 'https://www.neerzy.com/dashboard'
        }
      },
      delay: 2000
    },
    // 7. Trader typing DONE
    {
      type: 'typing',
      who: 'trader',
      delay: 1200
    },
    {
      type: 'message',
      message: {
        id: 'm7',
        sender: 'trader',
        type: 'text',
        text: 'DONE'
      },
      delay: 1500
    },
    // 8. Neerzy replying review sent
    {
      type: 'typing',
      who: 'neerzy',
      delay: 2000
    },
    {
      type: 'message',
      message: {
        id: 'm8',
        sender: 'neerzy',
        type: 'text',
        text: '✅ *Review request sent to Amjad!*\n\n🔗 Review link: https://search.google.com/local/writereview?placeid=ChIJ8...'
      },
      delay: 6000 // Let user read completed flow for 6 seconds
    }
  ];

  // Auto scroll to bottom
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, typingFor]);

  // Main animation runner
  useEffect(() => {
    const runStep = () => {
      const step = steps[currentStepIndex];
      if (!step) return;

      if (step.type === 'typing') {
        setTypingFor(step.who || null);
        
        // If trader is typing, animate the text input
        if (step.who === 'trader') {
          // Find next message text to type out
          const nextMsgStep = steps[currentStepIndex + 1];
          if (nextMsgStep && nextMsgStep.type === 'message' && nextMsgStep.message?.text) {
            const fullText = nextMsgStep.message.text;
            let currentText = '';
            let charIndex = 0;
            const typingInterval = setInterval(() => {
              if (charIndex < fullText.length) {
                currentText += fullText[charIndex];
                setInputValue(currentText);
                charIndex++;
              } else {
                clearInterval(typingInterval);
              }
            }, Math.floor(step.delay / (fullText.length + 1)));
          }
        }

        typingTimerRef.current = setTimeout(() => {
          setTypingFor(null);
          setCurrentStepIndex((prev) => (prev + 1) % steps.length);
        }, step.delay);

      } else if (step.type === 'message' && step.message) {
        // Clear input value if it was a trader message
        if (step.message.sender === 'trader') {
          setInputValue('');
        }
        
        setMessages((prev) => [...prev, step.message!]);
        
        typingTimerRef.current = setTimeout(() => {
          // If we reached the end, reset messages and start from index 0
          if (currentStepIndex === steps.length - 1) {
            setMessages([]);
            setInputValue('');
            setCurrentStepIndex(0);
          } else {
            setCurrentStepIndex((prev) => (prev + 1) % steps.length);
          }
        }, step.delay);
      }
    };

    runStep();

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [currentStepIndex]);

  return (
    <div className="wa-card flex flex-col justify-between">
      {/* WA Header */}
      <div className="wa-header flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          {/* Green active dot avatar */}
          <div className="relative w-8 h-8 rounded-full bg-emerald-700/20 border border-emerald-500/20 flex items-center justify-center font-bold text-xs text-white">
            N
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-[#075E54] rounded-full"></span>
          </div>
          <div>
            <div className="text-[14px] font-bold leading-none text-white">Neerzy Chatbot</div>
            <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">
              {typingFor === 'neerzy' ? 'typing...' : 'Online'}
            </div>
          </div>
        </div>
      </div>

      {/* WA Message Area */}
      <div 
        ref={bodyRef} 
        className="wa-body flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-3 p-4 bg-[#E5DDD5] select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`wa-bubble flex flex-col animate-fade-in ${
              msg.sender === 'trader' ? 'wa-sent ml-auto' : 'wa-received mr-auto'
            }`}
          >
            {msg.type === 'image' && msg.imageUrl && (
              <img src={msg.imageUrl} alt="Job photo" className="wa-image-preview max-h-32 object-cover" />
            )}
            
            {msg.type === 'card' && msg.cardContent ? (
              <div className="ai-card border-none p-1 bg-white rounded-lg">
                <div className="ai-status text-[10px] tracking-wider text-emerald-600 font-extrabold flex items-center gap-1">
                  <span>✨</span> NEERZY MAGIC
                </div>
                <div className="text-[11px] text-slate-800 space-y-1.5 mt-1 leading-normal font-semibold">
                  <div>📋 *Copy Post Text below:*</div>
                  <div className="bg-slate-50 border border-slate-100 rounded p-1.5 font-sans whitespace-pre-wrap text-[10px] text-slate-600">
                    <strong>{msg.cardContent.headline}</strong>{"\n\n"}{msg.cardContent.body}
                  </div>
                  <div className="text-emerald-800 underline break-all font-mono text-[9px]">
                    🌐 GBP Link: {msg.cardContent.gbpLink}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Type *DONE* when published.
                  </div>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-line text-[13px] leading-snug font-medium text-slate-800">
                {msg.text}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator bubble */}
        {typingFor === 'neerzy' && (
          <div className="wa-bubble wa-received mr-auto flex items-center gap-1 py-2 px-3 rounded-xl bg-white select-none">
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {/* WA Footer */}
      <div className="wa-footer flex items-center justify-between gap-2 p-2 bg-[#f0f0f0] border-t border-slate-200 shrink-0 z-10">
        <div className="flex-1 bg-white border border-slate-200 rounded-full px-3 py-1.5 flex items-center min-h-[36px]">
          <div className="text-[13px] font-medium text-slate-800 overflow-hidden text-ellipsis whitespace-nowrap">
            {inputValue || (typingFor === 'trader' ? '' : 'Type a message...')}
          </div>
          {typingFor === 'trader' && (
            <span className="w-0.5 h-4 bg-emerald-500 animate-pulse ml-0.5 shrink-0" />
          )}
        </div>
        <div className="w-9 h-9 rounded-full bg-[#075E54] flex items-center justify-center text-white shrink-0 shadow">
          {/* Send Icon */}
          <svg className="w-4 h-4 transform rotate-45 -translate-x-0.5 translate-y-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
          </svg>
        </div>
      </div>    </div>
  );
}
