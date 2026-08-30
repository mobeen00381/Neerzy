"use client";

import { useState } from 'react';
import { AlertTriangle, Copy, Check, X, Smartphone } from 'lucide-react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

interface FallbackReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone: string;
  reviewLink: string;
}

// Strip everything except digits and a leading "+", and normalize a "00"
// international dialing prefix to "+" for reliable wa.me / sms: links.
function normalizePhone(raw: string): string {
  let cleaned = (raw || '').replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  }
  return cleaned;
}

// wa.me expects the full international number WITHOUT the leading "+".
function phoneForWhatsApp(raw: string): string {
  return normalizePhone(raw).replace(/\+/g, '');
}

function buildMessage(customerName: string, reviewLink: string): string {
  const name = (customerName || '').trim() || 'Customer';
  return `Hi ${name}, thanks for choosing us today! Could you take 30 seconds to leave us a Google review? ${reviewLink}`;
}

export function FallbackReviewModal({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  reviewLink,
}: FallbackReviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const message = buildMessage(customerName, reviewLink);
  const encodedText = encodeURIComponent(message);
  const waPhone = phoneForWhatsApp(customerPhone);
  const smsPhone = normalizePhone(customerPhone);

  const whatsappUrl = `https://wa.me/${waPhone}?text=${encodedText}`;
  const smsUrl = `sms:${smsPhone}?body=${encodedText}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // Fallback for browsers / in-app webviews without clipboard API access.
      const textarea = document.createElement('textarea');
      textarea.value = message;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative bg-white text-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-10">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-emerald-600" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">
            WhatsApp didn't send
          </h2>
          <p className="text-slate-500 font-medium mb-6 leading-relaxed">
            We couldn't deliver the automated review request. Send it directly
            from your phone with one tap.
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Your message
            </div>
            <p className="text-sm text-slate-700 font-medium leading-relaxed break-words">
              {message}
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#25D366] hover:bg-[#1da851] text-[#073a30] rounded-2xl font-black transition-all active:scale-[0.98] shadow-lg shadow-[#25D366]/20"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Open WhatsApp
            </a>

            <a
              href={smsUrl}
              className="w-full flex items-center justify-center gap-3 py-4 bg-[#0F5C4D] hover:bg-[#073a30] text-white rounded-2xl font-black transition-all active:scale-[0.98] shadow-lg shadow-emerald-900/10"
            >
              <Smartphone className="w-5 h-5" />
              Open Device SMS
            </a>

            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black transition-all active:scale-[0.98] border ${
                copied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copied!' : 'Copy Link & Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
