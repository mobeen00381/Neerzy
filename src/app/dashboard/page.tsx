'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

import { AnalyticsPanel } from '@/components/dashboard/AnalyticsPanel';
import { PostsManager } from '@/components/dashboard/PostsManager';
import { ReviewsManager } from '@/components/dashboard/ReviewsManager';
import { BestPracticesGuide } from '@/components/dashboard/BestPracticesGuide';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'posts' | 'reviews' | 'best-practices'>('analytics');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    }
    getUser();
  }, [supabase.auth, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#25D366]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Dashboard Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-[#25D366] rounded-lg p-1.5 shadow-sm">
            <span className="text-black font-black text-xl leading-none block">N</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Neerzy Dashboard</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{user?.email}</div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Free Plan</div>
          </div>
          <button 
            onClick={handleSignOut}
            className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="container mx-auto flex gap-8">
          {(['analytics', 'posts', 'reviews', 'best-practices'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-bold text-sm uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'border-[#25D366] text-[#0F5C4D] dark:text-[#25D366]' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>
      </nav>

      {/* Dynamic Content Area */}
      <main className="container mx-auto p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'analytics' && <AnalyticsPanel userId={user?.id} />}
          {activeTab === 'posts' && <PostsManager userId={user?.id} />}
          {activeTab === 'reviews' && <ReviewsManager userId={user?.id} />}
          {activeTab === 'best-practices' && <BestPracticesGuide trade={user?.user_metadata?.trade_type} />}
        </div>
      </main>
    </div>
  );
}
