'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { supabase } from '@/lib/supabase';
import { PLAN_LIMITS } from '@/lib/plans';
import { Globe2, Share2, Camera, Send, Star, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsStats {
  plan?: { tier: string; name: string; daysLeft: number };
  quota?: {
    postsLimit: number; postsUsed: number; postsDailyLimit: number; postsDailyUsed: number;
    reviewsLimit: number; reviewsUsed: number; reviewsDailyLimit: number; reviewsDailyUsed: number;
  };
  counts?: {
    googlePosts: number; facebookPosts: number; instagramPosts: number; postsToday: number;
    reviewsSent: number; reviewsReceived: number; reviewsSentToday: number; reviewsReceivedToday: number;
    conversionRate: number;
  };
  channels?: { whatsapp: number; manual: number };
  timeline?: {
    reviews: { date: string; count: number }[];
    posts: { date: string; google: number; facebook: number; instagram: number }[];
  };
  recent_requests?: Array<{
    customer_name?: string | null;
    customer_phone?: string | null;
    status?: string | null;
    sent_via?: string | null;
    sent_at?: string | null;
    converted_at?: string | null;
    review_link?: string | null;
  }>;
}

interface AnalyticsPanelProps {
  userId: string;
  userPlan?: string;
  reviewStats?: any;
}

const fmt = (n: number | undefined) => (n ?? 0).toLocaleString();
const limitLabel = (n: number | undefined) => (n === -1 || n === undefined ? 'Unlimited' : `${n}`);

function MetricCard({
  title,
  value,
  subtitle,
  accent,
  icon,
}: {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm ${accent}`}>
          {icon}
        </span>
      </div>
      <div>
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">{title}</span>
        <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{value}</div>
        {subtitle && <span className="text-[10px] font-bold text-slate-500 mt-1 block">{subtitle}</span>}
      </div>
    </div>
  );
}

function QuotaBar({
  label,
  used,
  limit,
  color = 'bg-emerald-600',
}: {
  label: string;
  used: number;
  limit: number;
  color?: string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs font-bold mb-1.5">
        <span className="text-slate-500 uppercase tracking-widest text-[10px]">{label}</span>
        <span className="text-slate-800">
          {fmt(used)} / {limitLabel(limit)} used
        </span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.max(4, pct)}%` }} />
      </div>
    </div>
  );
}

const EmptyState = ({ text }: { text: string }) => (
  <div className="w-full h-48 flex items-center justify-center text-xs font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
    {text}
  </div>
);

function reviewBadge(status?: string | null, sentVia?: string | null) {
  if (status === 'review_received') return { label: '⭐ Review received', cls: 'bg-emerald-100 text-emerald-700' };
  if (status === 'delivered') return { label: '✅ Delivered', cls: 'bg-blue-100 text-blue-700' };
  if (status === 'failed') return { label: '⚠️ Not delivered', cls: 'bg-rose-100 text-rose-700' };
  if (status === 'manual_fallback' || sentVia === 'manual_link') return { label: '📱 Sent via device link', cls: 'bg-slate-100 text-slate-700' };
  return { label: '⏳ Sent', cls: 'bg-amber-100 text-amber-700' };
}

// ── Real data charts (no fake numbers — empty state when there is no data yet)

const ReviewsLine = ({ data }: { data?: { date: string; count: number }[] }) => {
  const hasData = (data || []).some(d => d.count > 0);
  if (!hasData) return <EmptyState text="No reviews received yet. Send your first review request to start your growth curve!" />;
  return (
    <Line
      data={{
        labels: data!.map(d => d.date.slice(5)),
        datasets: [
          {
            label: 'Reviews Received',
            data: data!.map(d => d.count),
            borderColor: '#0F5C4D',
            backgroundColor: 'rgba(15, 92, 77, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      }}
      options={{ responsive: true, plugins: { legend: { display: false } } }}
    />
  );
};

const PostsBar = ({ data }: { data?: { date: string; google: number; facebook: number; instagram: number }[] }) => {
  const hasData = (data || []).some(d => d.google > 0 || d.facebook > 0 || d.instagram > 0);
  if (!hasData) return <EmptyState text="No posts yet. Send a job photo on WhatsApp or type in the dashboard to create your first post!" />;
  return (
    <Bar
      data={{
        labels: data!.map(d => d.date.slice(5)),
        datasets: [
          { label: 'Google', data: data!.map(d => d.google), backgroundColor: '#0F5C4D', borderRadius: 4 },
          { label: 'Facebook', data: data!.map(d => d.facebook), backgroundColor: '#1877F2', borderRadius: 4 },
          { label: 'Instagram', data: data!.map(d => d.instagram), backgroundColor: '#E1306C', borderRadius: 4 },
        ],
      }}
      options={{
        responsive: true,
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
      }}
    />
  );
};

export function AnalyticsPanel({ userId, userPlan = 'free', reviewStats: _reviewStats }: AnalyticsPanelProps) {
  const planInfo = PLAN_LIMITS[userPlan.toLowerCase() as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;
  const isGrowth = userPlan.toLowerCase() === 'growth' || userPlan.toLowerCase() === 'agency' || userPlan.toLowerCase() === 'unlimited';

  const { data: stats, isLoading } = useQuery<AnalyticsStats>({
    queryKey: ['analytics', userId],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/analytics/stats?user_id=${userId}`, {
          headers: { 'Authorization': `Bearer ${session?.access_token || ''}` },
        });
        if (!res.ok) return {};
        const json = await res.json();
        return json.data || {};
      } catch (err) {
        console.error('Failed to load analytics:', err);
        return {};
      }
    },
    enabled: !!userId,
  });

  const c: Partial<NonNullable<AnalyticsStats['counts']>> = stats?.counts || {};
  const q: Partial<NonNullable<AnalyticsStats['quota']>> = stats?.quota || {};
  const planTier = stats?.plan?.tier || userPlan.toLowerCase();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading your real numbers...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Performance & Analytics</h2>
        <p className="text-xs text-slate-500 font-bold mt-1">
          Everything you&apos;ve done this billing cycle — posts on{' '}
          <span className="text-[#0F5C4D] font-extrabold">Google</span>,{' '}
          <span className="text-[#1877F2] font-extrabold">Facebook</span>,{' '}
          <span className="text-[#E1306C] font-extrabold">Instagram</span> and{' '}
          <span className="text-blue-600 font-extrabold">review requests</span> — all counted together from WhatsApp + dashboard.
          Current plan: <span className="uppercase text-emerald-700 font-extrabold">{planInfo.name}</span>
          {stats?.plan?.daysLeft ? ` · ${stats.plan.daysLeft} days left` : ''}
        </p>
      </div>

      {/* Metric Cards — row 1: posts by platform + review requests */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Google Posts"
          value={fmt(c.googlePosts)}
          subtitle={`${fmt(c.postsToday)} today · ${fmt(q.postsUsed)}/${limitLabel(q.postsLimit)} this month`}
          accent="bg-[#0F5C4D]"
          icon={<Globe2 className="w-5 h-5" />}
        />
        <MetricCard
          title={isGrowth ? 'Facebook Posts' : 'Facebook Posts — Growth'}
          value={fmt(c.facebookPosts)}
          subtitle={isGrowth ? `${fmt(c.facebookPosts)} this month` : 'Unlock with Growth plan'}
          accent={isGrowth ? 'bg-[#1877F2]' : 'bg-slate-300'}
          icon={<Share2 className="w-5 h-5" />}
        />
        <MetricCard
          title={isGrowth ? 'Instagram Posts' : 'Instagram Posts — Growth'}
          value={fmt(c.instagramPosts)}
          subtitle={isGrowth ? `${fmt(c.instagramPosts)} this month` : 'Unlock with Growth plan'}
          accent={isGrowth ? 'bg-[#E1306C]' : 'bg-slate-300'}
          icon={<Camera className="w-5 h-5" />}
        />
        <MetricCard
          title="Review Requests Sent"
          value={fmt(c.reviewsSent)}
          subtitle={`${fmt(c.reviewsSentToday)} today · ${fmt(q.reviewsUsed)}/${limitLabel(q.reviewsLimit)} this month`}
          accent="bg-blue-600"
          icon={<Send className="w-5 h-5" />}
        />
      </div>

      {/* Metric Cards — row 2: results + today usage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Reviews Received"
          value={fmt(c.reviewsReceived)}
          subtitle={`${fmt(c.reviewsReceivedToday)} today`}
          accent="bg-emerald-600"
          icon={<Star className="w-5 h-5" />}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${c.conversionRate ?? 0}%`}
          subtitle="Sent requests turned into reviews"
          accent="bg-indigo-600"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          title="Posts Today"
          value={fmt(c.postsToday)}
          subtitle={`${fmt(q.postsDailyUsed)}/${limitLabel(q.postsDailyLimit)} daily limit`}
          accent="bg-amber-600"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <MetricCard
          title="Review Requests Today"
          value={fmt(c.reviewsSentToday)}
          subtitle={`${fmt(q.reviewsDailyUsed)}/${limitLabel(q.reviewsDailyLimit)} daily limit`}
          accent="bg-cyan-600"
          icon={<Send className="w-5 h-5" />}
        />
      </div>

      {!isGrowth && (
        <div className="bg-gradient-to-r from-[#0F5C4D] to-emerald-700 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs font-semibold text-emerald-50 leading-relaxed">
            🚀 <span className="font-black">Growth plan ($79/mo):</span> every post also comes ready for{' '}
            <span className="font-black">Facebook</span> and <span className="font-black">Instagram</span> — 3 posts from one job,
            plus 60 posts & 60 review requests per month.
          </p>
          <a href="/pricing" className="shrink-0 inline-flex items-center justify-center px-5 py-2.5 bg-white text-emerald-900 text-xs font-black rounded-full hover:bg-emerald-50 transition-colors">
            Upgrade to Growth
          </a>
        </div>
      )}

      {/* Plan quota — always visible, real usage bars */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Your Plan Usage — This Month</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Posts & review requests used this billing cycle</p>
          </div>
          <span className="text-[10px] font-extrabold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 uppercase tracking-wider">
            {planInfo.name} Plan
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <QuotaBar label="📝 Posts — monthly limit" used={q.postsUsed ?? 0} limit={q.postsLimit ?? 0} color="bg-[#0F5C4D]" />
            <QuotaBar label="📝 Posts — daily limit" used={q.postsDailyUsed ?? 0} limit={q.postsDailyLimit ?? 0} color="bg-[#0F5C4D]" />
          </div>
          <div className="space-y-4">
            <QuotaBar label="⭐ Review requests — monthly limit" used={q.reviewsUsed ?? 0} limit={q.reviewsLimit ?? 0} color="bg-blue-600" />
            <QuotaBar label="⭐ Review requests — daily limit" used={q.reviewsDailyUsed ?? 0} limit={q.reviewsDailyLimit ?? 0} color="bg-blue-600" />
          </div>
        </div>
        {(planTier === 'free' || planTier === 'pro') && (
          <p className="text-xs font-semibold text-slate-400 pt-4 border-t border-slate-100">
            Need more room? <a href="/pricing" className="text-emerald-700 underline font-black">See plans</a> — Growth gives 60 posts & 60 review requests per month.
          </p>
        )}
      </div>

      {/* Real channels (replaces the old fake 78%/22% card) */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <h3 className="font-extrabold text-slate-900 text-base">How Review Requests Were Delivered</h3>
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4">Real delivery counts this cycle</p>
        {(c.reviewsSent ?? 0) > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#25D366] text-white rounded-xl flex items-center justify-center shadow-sm">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">WhatsApp Delivery</span>
                  <span className="text-[10px] font-bold text-slate-500">Sent directly by Neerzy</span>
                </div>
              </div>
              <span className="font-black text-emerald-800 text-sm">{fmt(stats?.channels?.whatsapp ?? 0)}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center shadow-sm">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">Manual / Device Link</span>
                  <span className="text-[10px] font-bold text-slate-500">Opened & sent from your phone</span>
                </div>
              </div>
              <span className="font-black text-slate-900 text-sm">{fmt(stats?.channels?.manual ?? 0)}</span>
            </div>
          </div>
        ) : (
          <EmptyState text="No review requests sent this cycle yet. Send your first one and it will appear here." />
        )}
      </div>

      {/* Recent review requests — per-customer tracking list */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <h3 className="font-extrabold text-slate-900 text-base">Recent Review Requests</h3>
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-4">Last 20 requests — who was asked and what happened</p>
        {(stats?.recent_requests || []).length === 0 ? (
          <EmptyState text="No review requests yet. After your first job, send a review request from WhatsApp or the dashboard and it will show up here." />
        ) : (
          <div className="divide-y divide-slate-100">
            {stats!.recent_requests!.map((r, i) => {
              const badge = reviewBadge(r.status, r.sent_via);
              const name = r.customer_name || 'Customer';
              const when = r.status === 'review_received' && r.converted_at
                ? new Date(r.converted_at).toLocaleDateString()
                : r.sent_at
                  ? new Date(r.sent_at).toLocaleDateString()
                  : '';
              return (
                <div key={`${r.sent_at}-${name}-${i}`} className="flex flex-col sm:flex-row sm:items-center gap-2 py-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-slate-900 truncate">{name}</p>
                      <p className="text-[11px] text-slate-400 font-semibold">
                        {r.customer_phone || '—'} · {when || 'date unknown'}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full uppercase inline-flex self-start sm:self-auto ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts — real 30-day data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Reviews Received (Last 30 Days)</h3>
          <ReviewsLine data={stats?.timeline?.reviews} />
        </div>
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Posts Published (Last 30 Days)</h3>
          <PostsBar data={stats?.timeline?.posts} />
        </div>
      </div>
    </div>
  );
}

