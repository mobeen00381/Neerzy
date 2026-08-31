'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, MessageCircle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export default function WelcomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gbpConnected, setGbpConnected] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);

  useEffect(() => {
    // Check if user already connected WhatsApp (you can implement logic here)
  }, []);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      // Check if GBP is already connected (logic can be expanded)
      if (user?.user_metadata?.gbp_connected) {
        setGbpConnected(true);
      }
    }
    getUser();
  }, []);

  const handleConnectGBP = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const isMock = !clientId || clientId.includes("your_google_client");

    if (isMock) {
      console.log("Mocking Google OAuth redirect client-side.");
      window.location.href = `/api/auth/gbp/callback?code=mock_oauth_code_bypass&state=${user?.id || ""}`;
      return;
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/api/auth/gbp/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.profile',
      access_type: 'offline',
      prompt: 'consent',
      state: user?.id || ""
    })}`;
    window.location.href = authUrl;
  };

  const handleConnectWhatsApp = () => {
    const text = encodeURIComponent(`Hi Neerzy! I want to connect my WhatsApp profile. CONNECT:${user?.id || ""}`);
    window.open(`https://wa.me/923206291617?text=${text}`, "_blank");
    setWhatsappConnected(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-16 h-16 rounded-full bg-blue-500/20"></div>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  const stepsCompleted = [gbpConnected, whatsappConnected].filter(Boolean).length;
  const allCompleted = stepsCompleted === 2;

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Premium Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* Main Glassmorphism Container */}
      <div className="relative z-10 w-full max-w-2xl bg-white/[0.02] border border-white/5 backdrop-blur-2xl rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-2 bg-blue-500/10 rounded-2xl mb-6 ring-1 ring-blue-500/20">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 mb-4 tracking-tight">
            Welcome, {user?.email?.split('@')[0] || 'Trader'}
          </h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed">
            You're just two steps away from supercharging your customer growth. Let's get your integrations set up.
          </p>
        </div>

        {/* Integration Cards */}
        <div className="space-y-4">
          {/* Step 1: Google Business Profile */}
          <button
            onClick={handleConnectGBP}
            disabled={gbpConnected}
            className={`group relative w-full flex items-center gap-5 md:gap-6 p-5 md:p-6 rounded-2xl border transition-all duration-300 overflow-hidden text-left ${
              gbpConnected 
                ? 'bg-emerald-500/5 border-emerald-500/20 cursor-default' 
                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-blue-500/30 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)]'
            }`}
          >
            {/* Hover Glow */}
            {!gbpConnected && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            )}

            <div className={`relative z-10 flex items-center justify-center w-14 h-14 shrink-0 rounded-2xl shadow-inner transition-colors duration-300 ${
              gbpConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-110'
            }`}>
              {gbpConnected ? <CheckCircle2 className="w-7 h-7" /> : <Store className="w-7 h-7" />}
            </div>

            <div className="relative z-10 flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1 gap-2">
                <h3 className={`text-lg md:text-xl font-bold truncate transition-colors duration-300 ${gbpConnected ? 'text-emerald-400' : 'text-slate-100'}`}>
                  Google Business
                </h3>
                {gbpConnected && <span className="shrink-0 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20">Connected</span>}
              </div>
              <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                Sync your business profile to manage reviews and posts automatically.
              </p>
            </div>
          </button>

          {/* Step 2: WhatsApp */}
          <button
            onClick={handleConnectWhatsApp}
            disabled={whatsappConnected}
            className={`group relative w-full flex items-center gap-5 md:gap-6 p-5 md:p-6 rounded-2xl border transition-all duration-300 overflow-hidden text-left ${
              whatsappConnected 
                ? 'bg-emerald-500/5 border-emerald-500/20 cursor-default' 
                : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-[#25D366]/30 hover:shadow-[0_0_30px_-5px_rgba(37,211,102,0.15)]'
            }`}
          >
            {/* Hover Glow */}
            {!whatsappConnected && (
              <div className="absolute inset-0 bg-gradient-to-r from-[#25D366]/0 via-[#25D366]/5 to-[#25D366]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            )}

            <div className={`relative z-10 flex items-center justify-center w-14 h-14 shrink-0 rounded-2xl shadow-inner transition-colors duration-300 ${
              whatsappConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#25D366]/10 text-[#25D366] group-hover:bg-[#25D366]/20 group-hover:scale-110'
            }`}>
              {whatsappConnected ? <CheckCircle2 className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
            </div>

            <div className="relative z-10 flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1 gap-2">
                <h3 className={`text-lg md:text-xl font-bold truncate transition-colors duration-300 ${whatsappConnected ? 'text-emerald-400' : 'text-slate-100'}`}>
                  WhatsApp
                </h3>
                {whatsappConnected && <span className="shrink-0 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20">Connected</span>}
              </div>
              <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                Link your WhatsApp to instantly reply to customers and track engagement.
              </p>
            </div>
          </button>
        </div>

        {/* Progress & Navigation */}
        <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center justify-center">
          {allCompleted ? (
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="group relative inline-flex h-14 w-full md:w-auto items-center justify-center gap-3 px-10 py-3 overflow-hidden font-bold text-white bg-blue-600 rounded-full hover:bg-blue-500 transition-all shadow-[0_0_40px_-10px_rgba(59,130,246,0.6)]"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
                <div className="relative h-full w-8 bg-white/20" />
              </div>
              <span className="relative">Go to Dashboard</span>
              <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="flex flex-col items-center gap-5 w-full">
              <div className="w-full max-w-xs">
                <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                  <span>Setup Progress</span>
                  <span>{stepsCompleted} of 2</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(stepsCompleted / 2) * 100}%` }}
                  />
                </div>
              </div>
              
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors border-b border-transparent hover:border-slate-300 pb-0.5"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
