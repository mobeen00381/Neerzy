'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { 
  Sparkles, 
  Smartphone, 
  MessageSquare, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  LogOut,
  Loader2
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('Your Business');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    thisMonth: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // If no session, allow running with simulated mock states for demo
          setLoading(false);
          return;
        }

        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile && profile.business_name) {
          setBusinessName(profile.business_name);
        } else if (profile && profile.company_name) {
          setBusinessName(profile.company_name);
        }

        // Fetch posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false });

        if (postsData) {
          const total = postsData.length;
          const currentMonth = postsData.filter(p => {
            const date = new Date(p.created_at);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length;

          setStats({
            totalPosts: total,
            thisMonth: currentMonth
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/signup');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#0F5C4D]" />
        <p className="font-bold text-slate-500 animate-pulse">Loading dashboard statistics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between">
      <div>
        {/* Top Navigation */}
        <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">Neerzy</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-bold text-slate-900 leading-none">{businessName}</span>
                <span className="text-[10px] text-emerald-600 font-bold mt-1">● Live Connected</span>
              </div>
              <div className="w-9 h-9 bg-[#0F5C4D] rounded-xl flex items-center justify-center text-white text-sm font-black shadow-md shadow-[#0F5C4D]/10">
                {businessName.charAt(0).toUpperCase()}
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-6 py-12 space-y-8">
          
          {/* Welcome Section */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Google Sync Active</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Welcome to Neerzy! 👋
              </h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl">
                Your Google Business Profile is securely connected. Text updates to our WhatsApp assistant at any time to publish posts, upload job photos, and trigger organic review requests.
              </p>
            </div>
            
            {/* Visual Phone Badge */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center text-white">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Twilio Gateway</div>
                <div className="text-xs font-black text-slate-900">+92 305 6500917</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Stat Card 1 */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Posts</span>
                <div className="text-4xl font-black text-slate-900">{stats.totalPosts}</div>
                <p className="text-[10px] text-emerald-600 font-semibold">Campaign total</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold border border-emerald-100/50">
                📝
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">This Month</span>
                <div className="text-4xl font-black text-slate-900">{stats.thisMonth}</div>
                <p className="text-[10px] text-emerald-600 font-semibold">Active billing cycle</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center text-xl font-bold border border-teal-100/50">
                📅
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200/60 p-8 md:p-10 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Quick Actions</h3>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Button 1: Download Webapp */}
              <a
                href="/webapp"
                className="flex items-start gap-4 p-5 border-2 border-slate-100 rounded-2xl hover:border-[#0F5C4D]/60 hover:bg-[#0F5C4D]/5 transition-all group"
              >
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[#0F5C4D] group-hover:scale-110 transition-transform">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <span>📱 Download Webapp</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1 leading-normal">
                    Install Neerzy on your home screen for quick post management on-site.
                  </p>
                </div>
              </a>

              {/* Button 2: WhatsApp Connection */}
              <a
                href="https://wa.me/923056500917?text=Hi%20Neerzy!%20I%20need%20help%20with%20my%20account"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-5 border-2 border-slate-100 rounded-2xl hover:border-emerald-500/60 hover:bg-emerald-50/5 transition-all group"
              >
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-600 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <span>💬 Connect on WhatsApp</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1 leading-normal">
                    Instantly message our support agent or start configuring your local listing.
                  </p>
                </div>
              </a>
            </div>
          </div>

        </main>
      </div>

      {/* Footer Info */}
      <footer className="w-full text-center py-8 text-slate-400 text-xs border-t border-slate-200/50 bg-white">
        <p className="font-semibold">Need help? Contact us on WhatsApp • &copy; {new Date().getFullYear()} Neerzy AI</p>
      </footer>
    </div>
  );
}
