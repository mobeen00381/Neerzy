'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

export default function WelcomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
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
  }, [supabase.auth]);

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
    window.open("https://wa.me/923056500917?text=Hi%20Neerzy!%20I%20want%20to%20connect%20my%20WhatsApp%20profile.", "_blank");
    setWhatsappConnected(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25D366]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <h1 className="text-3xl font-bold mb-2 text-center">
        Welcome to Neerzy, {user?.email?.split('@')[0] || 'Trader'}! 🎉
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8 text-center max-w-md">
        Get more customers from Google in 2 quick steps:
      </p>

      <div className="space-y-4 w-full max-w-md">
        {/* Step 1: Connect Google Business Profile */}
        <button
          onClick={handleConnectGBP}
          disabled={gbpConnected}
          className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
            gbpConnected 
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
              : 'bg-white border-slate-200 hover:border-[#25D366] hover:shadow-md dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <div className={`p-3 rounded-full ${gbpConnected ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            {gbpConnected ? '✓' : 'G'}
          </div>
          <div className="flex-1">
            <div className="font-bold">Connect Google Business Profile</div>
            <div className="text-sm opacity-80">Fetch your business name, reviews & post permissions</div>
          </div>
        </button>

        {/* Step 2: Connect WhatsApp */}
        <button
          onClick={handleConnectWhatsApp}
          disabled={whatsappConnected}
          className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
            whatsappConnected 
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
              : 'bg-white border-slate-200 hover:border-[#25D366] hover:shadow-md dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <div className={`p-3 rounded-full ${whatsappConnected ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            {whatsappConnected ? '✓' : '💬'}
          </div>
          <div className="flex-1">
            <div className="font-bold">Connect WhatsApp</div>
            <div className="text-sm opacity-80">Link your WhatsApp to create posts and track reviews instantly</div>
          </div>
        </button>
      </div>

      {/* Progress & Navigation */}
      <div className="mt-12 text-center">
        {gbpConnected && whatsappConnected ? (
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-[#25D366] hover:bg-[#1da851] text-black rounded-full px-8 py-6 text-lg font-bold shadow-lg transform transition hover:scale-105"
          >
            Go to Dashboard →
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="text-slate-400 text-sm font-medium">
              {[gbpConnected, whatsappConnected].filter(Boolean).length}/2 steps completed
            </div>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="text-slate-400 hover:text-slate-600 text-sm underline underline-offset-4"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
