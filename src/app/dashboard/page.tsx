'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { 
  TrendingUp, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  FileText, 
  Camera, 
  MessageSquare, 
  BarChart3, 
  PlusCircle, 
  Activity,
  Heart,
  Loader2
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('Your Business');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 12,
    thisMonth: 4,
    avgRating: 4.6,
    totalReviews: 48,
    profileViews: 1247,
    websiteClicks: 89
  });
  
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'post', message: 'Google Post published', date: '2 hours ago', status: 'success' },
    { id: 2, type: 'review', message: 'New 5-star review received', date: '5 hours ago', status: 'success' },
    { id: 3, type: 'photo', message: '3 photos uploaded', date: '1 day ago', status: 'success' },
    { id: 4, type: 'post', message: 'Google Post published', date: '2 days ago', status: 'success' },
  ]);

  // Load authenticated user and active GMB metrics if available
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          if (profile.business_name) {
            setBusinessName(profile.business_name);
          }
          // Fetch ratings total or photos count if they exist on the profile
          setStats(prev => ({
            ...prev,
            avgRating: profile.rating || 4.6,
            totalReviews: profile.review_count || 48,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="font-bold text-slate-500 animate-pulse">Initializing your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* 🏆 Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#25D366] font-black text-xs uppercase tracking-widest mb-2">
            <Sparkles className="w-4 h-4" /> System Status: Optimal
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Welcome back, <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25D366] to-[#0F5C4D]">
              {businessName}
            </span>
          </h2>
          <p className="text-slate-500 font-semibold text-sm mt-1">Manage your Google Business Profile</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-3 bg-slate-50 rounded-xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Session Type</p>
            <p className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" /> WhatsApp Active
            </p>
          </div>
        </div>
      </div>

      {/* 📊 Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Posts"
          value={stats.totalPosts}
          subtitle={`${stats.thisMonth} this month`}
          icon="📝"
          trend="+2 posts"
        />
        <StatCard 
          title="Avg Rating"
          value={stats.avgRating}
          subtitle={`${stats.totalReviews} reviews`}
          icon="⭐"
          trend="+0.2 rating"
        />
        <StatCard 
          title="Profile Views"
          value={stats.profileViews}
          subtitle="Last 30 days"
          icon="👁"
          trend="+12% views"
        />
        <StatCard 
          title="Website Clicks"
          value={stats.websiteClicks}
          subtitle="Last 30 days"
          icon="🔗"
          trend="+8% clicks"
        />
      </div>

      {/* 🧩 Main Activity & Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity List */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between overflow-hidden">
          <div>
            <div className="p-6 border-b border-slate-50 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-slate-800 text-lg">Recent Activity</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="p-6 hover:bg-slate-50/50 transition-all flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-[#25D366] rounded-full shrink-0 animate-pulse" />
                    <div>
                      <p className="text-sm font-extrabold text-slate-800 leading-tight">{activity.message}</p>
                      <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {activity.date}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-100/50 text-[10px] font-black text-emerald-700 uppercase tracking-wider rounded-lg">
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 border-t border-slate-50">
            <button className="text-sm font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 group">
              <span>View all activity</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Quick Actions List */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-50 pb-4">
            <h3 className="font-extrabold text-slate-800 text-lg">Quick Actions</h3>
          </div>
          <div className="space-y-4">
            <QuickActionButton 
              icon={<FileText className="w-5 h-5 text-indigo-500" />}
              title="Create Post"
              description="Share an update with customers"
              color="indigo"
              onClick={() => router.push('/dashboard/posts')}
            />
            <QuickActionButton 
              icon={<Camera className="w-5 h-5 text-emerald-500" />}
              title="Upload Photos"
              description="Add new storefront photos"
              color="emerald"
              onClick={() => router.push('/dashboard/posts')}
            />
            <QuickActionButton 
              icon={<MessageSquare className="w-5 h-5 text-amber-500" />}
              title="Reply to Reviews"
              description="2 reviews need responses"
              color="amber"
              badge="2"
              onClick={() => router.push('/dashboard/reviews')}
            />
            <QuickActionButton 
              icon={<BarChart3 className="w-5 h-5 text-teal-500" />}
              title="View Analytics"
              description="See search performance"
              color="teal"
              onClick={() => router.push('/gmb-audit-tool')}
            />
          </div>
        </div>
      </div>

      {/* ❤️ Profile Health Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h3 className="font-extrabold text-slate-800 text-lg">Profile Health Score</h3>
          </div>
          <span className="text-2xl font-black text-[#0F5C4D]">78/100</span>
        </div>
        
        <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-[#25D366] to-[#0F5C4D] h-full rounded-full transition-all duration-1000" style={{ width: '78%' }}></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-50 text-sm">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#25D366] rounded-full shrink-0" />
            <span className="text-slate-500 font-semibold">Completeness: <strong className="text-slate-800 font-extrabold">85%</strong></span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-amber-400 rounded-full shrink-0" />
            <span className="text-slate-500 font-semibold">Photos: <strong className="text-slate-800 font-extrabold">45/100</strong></span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-[#25D366] rounded-full shrink-0" />
            <span className="text-slate-500 font-semibold">Reviews: <strong className="text-slate-800 font-extrabold">4.6★</strong></span>
          </div>
        </div>
      </div>
      
    </div>
  );
}

// Component: Stat Card
function StatCard({ title, value, subtitle, icon, trend }: { 
  title: string; 
  value: string | number; 
  subtitle: string;
  icon: string;
  trend: string;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-100/50 shadow-inner">{icon}</span>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 rounded-lg">
          {trend}
        </span>
      </div>
      <div className="text-3xl font-black text-slate-800 mb-1 tracking-tight">{value}</div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</div>
      <div className="text-xs font-semibold text-slate-400">{subtitle}</div>
    </div>
  );
}

// Component: Quick Action Button
function QuickActionButton({ icon, title, description, color, badge, onClick }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color: string;
  badge?: string;
  onClick?: () => void;
}) {
  const colorClasses = {
    indigo: 'hover:bg-indigo-50/50 hover:border-indigo-200',
    emerald: 'hover:bg-emerald-50/50 hover:border-emerald-200',
    amber: 'hover:bg-amber-50/50 hover:border-amber-200',
    teal: 'hover:bg-teal-50/50 hover:border-teal-200'
  };

  return (
    <button 
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border border-slate-100 bg-slate-50/20 ${colorClasses[color as keyof typeof colorClasses]} transition-all group flex items-start gap-4`}
    >
      <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm group-hover:scale-110 transition-transform shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-extrabold text-slate-800 text-sm leading-none">{title}</h4>
          {badge && (
            <span className="text-[10px] font-black text-white bg-rose-500 px-2 py-0.5 rounded-full leading-none">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs font-semibold text-slate-400 mt-1 leading-snug">{description}</p>
      </div>
    </button>
  );
}
