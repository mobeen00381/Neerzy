"use client";

import { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  sender: 'trader' | 'neerzy';
  type: 'text' | 'image' | 'card';
  text?: string;
  imageUrl?: string;
  cardContent?: {
    variant: 'google' | 'social';
    headline?: string;
    body?: string;
    cta?: string;
    hashtags?: string;
    fbText?: string;
    igText?: string;
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

  // Story mirrors the real Neerzy WhatsApp workflow:
  // 1) Trader sends the job photo + short description
  // 2) Trader types POST -> Neerzy generates the content
  // 3) Neerzy replies with the ready-to-copy Google post (+ Facebook/Instagram captions)
  // 4) Trader posts it, replies DONE -> review request goes to the customer
  const steps: AnimationStep[] = [
    // 1. Trader sends the job photo with a short description
    { type: 'typing', who: 'trader', delay: 1600 },
    {
      type: 'message',
      message: {
        id: 'm1',
        sender: 'trader',
        type: 'image',
        imageUrl: '/images/plumber_job_photo.png',
        text: 'Kitchen sink fixed for Mrs Smith. Clean finish.'
      },
      delay: 1800
    },
    // 2. Trader types POST to generate the content
    { type: 'typing', who: 'trader', delay: 1000 },
    {
      type: 'message',
      message: { id: 'm2', sender: 'trader', type: 'text', text: 'POST' },
      delay: 1000
    },
    // 3. Neerzy sends the ready-to-copy Google post
    { type: 'typing', who: 'neerzy', delay: 2200 },
    {
      type: 'message',
      message: {
        id: 'm3',
        sender: 'neerzy',
        type: 'card',
        cardContent: {
          variant: 'google',
          headline: 'Kitchen Sink Replacement - Mrs Smith',
          body: 'Just finished replacing the kitchen sink for Mrs Smith in Austin. New faucet installed, drainage checked, everything running smoothly.',
          cta: 'Need plumbing done right? Give us a call today.',
          hashtags: '#Plumber #Austin #KitchenRepair'
        }
      },
      delay: 2800
    },
    // 4. Bonus: Facebook + Instagram captions (Post 2 & 3 of the 3-post flow)
    {
      type: 'message',
      message: {
        id: 'm4',
        sender: 'neerzy',
        type: 'card',
        cardContent: {
          variant: 'social',
          fbText: 'Another sink saved in Austin! Call us for fast, clean plumbing work.',
          igText: 'Kitchen sink replaced & leak-free. #PlumberLife #AustinTX'
        }
      },
      delay: 2600
    },
    // 5. Trader copies, posts to Google, and replies DONE
    { type: 'typing', who: 'trader', delay: 1500 },
    {
      type: 'message',
      message: { id: 'm5', sender: 'trader', type: 'text', text: 'Posted on Google \u2705 DONE' },
      delay: 1700
    },
    // 6. Neerzy sends the review request to the customer
    { type: 'typing', who: 'neerzy', delay: 2200 },
    {
      type: 'message',
      message: {
        id: 'm6',
        sender: 'neerzy',
        type: 'text',
        text: '\u2B50 Review request sent to Mrs Smith.\n\nOne job \u2192 Google post + Facebook + Instagram + a review on the way. All done!'
      },
      delay: 6000
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
          <div className="relative w-8 h-8 rounded-full bg-emerald-700/20 border border-emerald-500/20 flex items-center justify-center font-bold text-xs text-white">
            N
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#22C55E] border-2 border-[#075E54] rounded-full"></span>
          </div>
          <div>
            <div className="text-[14px] font-bold leading-none text-white">Neerzy</div>
            <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">
              {typingFor === 'neerzy' ? 'Generating your post...' : 'Online'}
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
              msg.cardContent.variant === 'social' ? (
                <div className="bg-white rounded-lg p-3 border border-[#E1E8E4] shadow-sm" style={{ minWidth: '200px' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[10px] font-bold text-[#0F5132] tracking-wider uppercase">Posts 2 &amp; 3 of 3 &mdash; Facebook + Instagram</span>
                  </div>
                  <div className="text-[11px] text-[#0A2E22] space-y-1.5 leading-normal">
                    <div>
                      <div className="text-[9px] font-bold text-[#5B6B64] uppercase">Facebook</div>
                      <div className="text-[10px] text-[#5B6B64] leading-relaxed">{msg.cardContent.fbText}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-[#5B6B64] uppercase">Instagram</div>
                      <div className="text-[10px] text-[#5B6B64] leading-relaxed">{msg.cardContent.igText}</div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#E1E8E4]">
                      <div className="text-[9px] text-[#5B6B64]">Copy each caption &rarr; paste with your saved photo &rarr; Share.</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-3 border border-[#E1E8E4] shadow-sm" style={{ minWidth: '200px' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-[10px] font-bold text-[#0F5132] tracking-wider uppercase">Post ready &mdash; copy the text</span>
                  </div>
                  <div className="bg-[#F4F7F5] rounded-md p-2 border border-[#E1E8E4]">
                    <div className="text-[11px] font-bold text-[#0A2E22]">{msg.cardContent.headline}</div>
                    <div className="text-[10px] text-[#5B6B64] leading-relaxed mt-1">{msg.cardContent.body}</div>
                    <div className="text-[10px] text-[#5B6B64] leading-relaxed mt-1">{msg.cardContent.cta}</div>
                    <div className="text-[10px] text-[#1877F2] mt-1">{msg.cardContent.hashtags}</div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#E1E8E4]">
                    <div className="text-[9px] text-[#5B6B64]">Copy &rarr; paste into your Google profile &rarr; attach the photo &rarr; Post.</div>
                  </div>
                </div>
              )
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
          <svg className="w-4 h-4 transform rotate-45 -translate-x-0.5 translate-y-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
