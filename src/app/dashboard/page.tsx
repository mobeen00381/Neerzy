// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PlanStatusCard } from "@/components/dashboard/PlanStatusCard";
import { GbpConnectModal } from "@/components/dashboard/GbpConnectModal";
import { AppDownloadCard } from "@/components/dashboard/AppDownloadCard";
import { PostUsageTracker } from "@/components/dashboard/PostUsageTracker";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";
import { getUserUsage, UsageStats } from "@/lib/usage";
import { Loader2, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const usage = await getUserUsage(
          user.id, 
          (user.user_metadata?.selected_plan || 'free') as any,
          user.created_at
        );
        setStats(usage);
      }
      setLoading(false);
    }
    initDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="font-bold text-slate-500 animate-pulse">Initializing your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4" /> System Status: Optimal
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Welcome back, <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              {user?.user_metadata?.business_name || user?.email?.split('@')[0]}
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-3 bg-slate-50 rounded-xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Session Type</p>
            <p className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" /> WhatsApp Connected
            </p>
          </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <PostUsageTracker 
        total={stats?.totalPostsUsed || 0} 
        monthly={stats?.dailyPostsUsed || 0} 
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Connection & Setup */}
        <div className="lg:col-span-2 space-y-8">
          <GbpConnectModal />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                   {[
                     { label: "New Post", icon: "📸", color: "bg-blue-50 text-blue-600" },
                     { label: "Settings", icon: "⚙️", color: "bg-slate-50 text-slate-600" },
                     { label: "Analytics", icon: "📊", color: "bg-indigo-50 text-indigo-600" },
                     { label: "Help", icon: "🆘", color: "bg-rose-50 text-rose-600" },
                   ].map(action => (
                     <button key={action.label} className="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                        <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</span>
                        <span className="text-xs font-bold text-slate-600">{action.label}</span>
                     </button>
                   ))}
                </div>
             </div>
             <AppDownloadCard />
          </div>
        </div>

        {/* Right Column: Plan & Upsell */}
        <div className="space-y-8">
          <PlanStatusCard 
            tier={user?.user_metadata?.selected_plan || "free"} 
            used={stats?.totalPostsUsed || 0} 
          />
          <UpgradePrompt />
        </div>
      </div>
    </div>
  );
}
