// components/dashboard/GbpConnectModal.tsx
"use client";

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, ShieldCheck, Loader2 } from 'lucide-react';

interface GbpConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export function GbpConnectModal({ isOpen, onClose, userId }: GbpConnectModalProps) {
  const [connecting, setConnecting] = useState(false);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleConnect = async () => {
    setConnecting(true);
    
    try {
      // Google OAuth flow simulation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user profile
      await supabase
        .from('profiles')
        .update({ gbp_connected: true, gbp_connected_at: new Date().toISOString() })
        .eq('id', userId);
      
      onClose();
      window.location.reload(); // Refresh to show connected state
    } catch (error) {
      console.error('GBP connect failed:', error);
    } finally {
      setConnecting(false);
    }
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
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>

          <h2 className="text-3xl font-black mb-3 tracking-tight">Connect Business</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            Securely link your Google Business Profile. Neerzy uses official APIs to automate your local SEO.
          </p>

          <div className="space-y-4 mb-10">
             {[
               "Auto-publish WhatsApp photos to Google",
               "Real-time performance analytics",
               "Review automation & management"
             ].map((feature, i) => (
               <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircleIcon className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-600">{feature}</span>
               </div>
             ))}
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black flex items-center justify-center gap-4 disabled:opacity-50 shadow-xl shadow-slate-200 active:scale-95"
          >
            {connecting ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Connect with Google</span>
              </>
            )}
          </button>
          
          <p className="text-[10px] text-slate-400 text-center font-black uppercase tracking-widest mt-8">
            By connecting, you agree to our <a href="/terms" className="text-blue-600 hover:underline">Terms</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
    </svg>
  );
}
