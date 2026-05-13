// components/dashboard/GbpConnectModal.tsx
"use client";

import { useState } from "react";
import { Building2, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface GbpConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export function GbpConnectModal({ isOpen, onClose, userId }: GbpConnectModalProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "success" | "error">("idle");

  const handleConnect = () => {
    setStatus("connecting");
    // Simulate OAuth flow for Google Business Profile
    setTimeout(() => {
      setStatus("success");
      setTimeout(onClose, 1500);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative bg-white text-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-10">
          <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-8">
            <Building2 className="w-10 h-10 text-blue-600" />
          </div>

          <h2 className="text-3xl font-black mb-3 tracking-tight">Google Business</h2>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            Link your Google Business Profile to Neerzy. This allows our AI to automatically post your WhatsApp updates directly to your public listing.
          </p>

          {status === "success" ? (
            <div className="flex flex-col items-center justify-center py-4 animate-in fade-in slide-in-from-bottom-2">
               <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                 <Check className="w-8 h-8" />
               </div>
               <p className="font-black text-xl text-slate-900">Successfully Connected!</p>
            </div>
          ) : (
            <Button 
              onClick={handleConnect}
              disabled={status === "connecting"}
              className="w-full bg-blue-600 hover:bg-blue-700 h-16 text-xl font-black rounded-2xl shadow-xl shadow-blue-100"
            >
              {status === "connecting" ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="animate-spin" /> Connecting...
                </div>
              ) : "Connect Profile"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
