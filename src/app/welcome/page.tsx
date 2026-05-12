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
  const [appDownloaded, setAppDownloaded] = useState(false);

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
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      redirect_uri: `${window.location.origin}/api/auth/gbp/callback`,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.profile',
      access_type: 'offline',
      prompt: 'consent',
      state: user?.id || ""
    })}`;
    window.location.href = authUrl;
  };

  const handleDownloadApp = () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setAppDownloaded(true);
    } else {
      // In a real PWA this would trigger the install prompt
      // For now we redirect to /dashboard to simulate "using the app"
      window.location.href = '/dashboard';
    }
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

        {/* Step 2: Download Neerzy Web App */}
        <button
          onClick={handleDownloadApp}
          disabled={appDownloaded}
          className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
            appDownloaded 
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
              : 'bg-white border-slate-200 hover:border-[#25D366] hover:shadow-md dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <div className={`p-3 rounded-full ${appDownloaded ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
            {appDownloaded ? '✓' : '📱'}
          </div>
          <div className="flex-1">
            <div className="font-bold">Install Neerzy App</div>
            <div className="text-sm opacity-80">Create posts & track reviews instantly from your home screen</div>
          </div>
        </button>
      </div>

      {/* Progress & Navigation */}
      <div className="mt-12 text-center">
        {gbpConnected && appDownloaded ? (
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-[#25D366] hover:bg-[#1da851] text-black rounded-full px-8 py-6 text-lg font-bold shadow-lg transform transition hover:scale-105"
          >
            Go to Dashboard →
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="text-slate-400 text-sm font-medium">
              {[gbpConnected, appDownloaded].filter(Boolean).length}/2 steps completed
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
