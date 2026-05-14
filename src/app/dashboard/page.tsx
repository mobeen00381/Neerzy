// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PlanStatusCard } from "@/components/dashboard/PlanStatusCard";
import { GbpConnectModal } from "@/components/dashboard/GbpConnectModal";
import { AppDownloadCard } from "@/components/dashboard/AppDownloadCard";
import { PostUsageTracker } from "@/components/dashboard/PostUsageTracker";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";
import { getUserUsage, UsageStats } from "@/lib/usage";
import { PlanType } from "@/lib/plans";
import { Loader2, Sparkles, Clock, ChevronRight, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [showGbpModal, setShowGbpModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }
      
      // Fetch user profile for plan and trial info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      
      if (profile) {
        setUser({ ...authUser, ...profile });
        
        // Fetch usage stats
        try {
          const stats = await getUserUsage(
            authUser.id,
            (profile.selected_plan as PlanType) || 'free',
            profile.created_at || authUser.created_at
          );
          setUsage(stats);
        } catch (error) {
          console.error("Usage fetch failed:", error);
        }
      } else {
        // Fallback for metadata-only users
        setUser(authUser);
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="font-bold text-slate-500 animate-pulse">Initializing your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4" /> System Status: Optimal
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Welcome back, <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] to-[#0F5C4D]">
              {user?.business_name || user?.user_metadata?.business_name || "Trader"}
            </span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">Manage your Google Business posts and grow your local presence.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-3 bg-slate-50 rounded-xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Session Type</p>
            <p className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" /> WhatsApp Connected
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section: Usage & Actions */}
        <div className="lg:col-span-2 space-y-8">
          
          <PostUsageTracker 
            usage={usage}
            plan={(user?.selected_plan as PlanType) || 'free'}
            onLimitReached={() => setShowGbpModal(true)}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-[#0F5C4D] text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#25D366]/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-[#25D366]/40 transition-all duration-700" />
                <h3 className="text-xl font-bold mb-2 relative z-10">Google Business Profile</h3>
                <p className="text-slate-200 text-sm mb-8 relative z-10 leading-relaxed">
                  Connect your profile to enable automatic WhatsApp posting.
                </p>
                {user?.gbp_connected ? (
                   <div className="flex items-center gap-3 text-[#25D366] font-bold py-3 px-6 bg-white/5 rounded-2xl border border-white/10 w-fit">
                      <div className="w-5 h-5 bg-[#25D366]/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      Connected
                   </div>
                ) : (
                  <button 
                    onClick={() => setShowGbpModal(true)}
                    className="w-full bg-[#25D366] hover:bg-[#1DA851] text-slate-900 h-14 text-lg font-black rounded-2xl transition-all shadow-lg shadow-teal-900/20 active:scale-95"
                  >
                    Connect Profile
                  </button>
                )}
             </div>
             
             <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-xl transition-all cursor-pointer" onClick={() => router.push('/gmb-audit-tool')}>
               <div>
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">🛡️</div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">Local SEO Audit</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Instantly check your visibility score and audit missing GMB technical fields.
                  </p>
               </div>
               <button className="text-sm font-black text-blue-600 flex items-center gap-1">
                 Run Health Check <ChevronRight className="w-4 h-4" />
               </button>
             </div>
          </div>
          
          <AppDownloadCard />

          {/* Recent Activity */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900">Recent Activity</h3>
              <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { title: "Emergency Pipe Fix", time: "2 hours ago", status: "Published", icon: "✨" },
                { title: "Kitchen Remodel", time: "Yesterday", status: "Scheduled", icon: "📅" },
                { title: "Boiler Installation", time: "Oct 12", status: "Published", icon: "✨" },
              ].map((post, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-md transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">{post.icon}</div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{post.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.time}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    post.status === "Published" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {post.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Plan & Upgrade */}
        <div className="space-y-8">
          <PlanStatusCard 
            plan={(user?.selected_plan as PlanType) || 'free'}
            usage={usage}
            trialStart={user?.trial_started_at || user?.created_at}
          />
          
          {(user?.selected_plan === 'free' || !user?.selected_plan) && (
            <UpgradePrompt />
          )}

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
             <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Links</h3>
             <div className="space-y-2">
                {['Documentation', 'Video Tutorials', 'Support Center', 'Billing'].map(link => (
                  <button key={link} className="w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center justify-between group">
                    {link} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* GBP Connect Modal Overlay */}
      <GbpConnectModal 
        isOpen={showGbpModal}
        onClose={() => setShowGbpModal(false)}
        userId={user?.id}
      />
    </div>
  );
}
