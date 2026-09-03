import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PLAN_LIMITS, getCycleStartIso, getRemainingDays } from '@/lib/plans';
import { countUserPosts } from '@/lib/post-usage';
import { getAgencyClientPhones } from '@/lib/agency';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Real trader analytics — one source of truth for the dashboard Analytics tab.
// Shows EVERYTHING the trader does (Google posts, Facebook posts, Instagram
// posts, review requests) plus their live plan quota for the current 30-day
// billing cycle. WhatsApp + dashboard activity counts together.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const COMPLETED_POST_STATUSES = ['generated', 'published'];

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function bucketize<T>(
  rows: any[],
  dateField: (r: T) => string | null,
  days: number
): Map<string, number> {
  const map = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    map.set(dayKey(d), 0);
  }
  for (const r of rows) {
    const raw = dateField(r);
    if (!raw) continue;
    const iso = new Date(raw);
    if (isNaN(iso.getTime())) continue;
    const key = dayKey(iso);
    if (map.has(key)) map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

export async function GET(req: Request) {
  try {
    // Auth
    const authHeader = req.headers.get('authorization') || '';
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    let userId: string | null = user?.id || null;
    const url = new URL(req.url);
    if (!userId) userId = url.searchParams.get('user_id');
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    // Profile → plan + cycle anchor + phone (WhatsApp rows key by phone)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('selected_plan, phone, plan_started_at, trial_started_at, created_at')
      .eq('id', userId)
      .maybeSingle();

    const phone = profile?.phone || null;
    const planTier = (profile?.selected_plan || 'free').toLowerCase() as keyof typeof PLAN_LIMITS;
    const planInfo = PLAN_LIMITS[planTier] || PLAN_LIMITS.free;
    const anchor = profile?.plan_started_at || profile?.trial_started_at || profile?.created_at || new Date().toISOString();
    const cycleStartIso = getCycleStartIso(anchor);
    const daysLeft = planInfo.trialDays > 0 && anchor ? getRemainingDays(anchor, planInfo.trialDays) : 0;

    // ── Quota usage (posts) — EXACT same engine as plan enforcement
    const usage = await countUserPosts(userId, phone, cycleStartIso);

    // ── Platform counts (this billing cycle)
    let facebookPosts = 0;
    let instagramPosts = 0;
    if (userId) {
      const f1 = await supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('social_facebook', 'is', null).gte('created_at', cycleStartIso);
      const f2 = await supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('social_instagram', 'is', null).gte('created_at', cycleStartIso);
      facebookPosts += f1.count || 0;
      instagramPosts += f2.count || 0;
    }
    if (phone) {
      const f3 = await supabaseAdmin.from('pending_posts').select('*', { count: 'exact', head: true }).eq('user_phone', phone).not('social_facebook', 'is', null).gte('created_at', cycleStartIso);
      const f4 = await supabaseAdmin.from('pending_posts').select('*', { count: 'exact', head: true }).eq('user_phone', phone).not('social_instagram', 'is', null).gte('created_at', cycleStartIso);
      facebookPosts += f3.count || 0;
      instagramPosts += f4.count || 0;
    }

    // ── Review requests (this cycle + today + channels)
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    const { count: reviewsSent } = await supabaseAdmin
      .from('review_requests').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('sent_at', cycleStartIso);

    const { count: reviewsReceived } = await supabaseAdmin
      .from('review_requests').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'review_received').gte('converted_at', cycleStartIso);

    const { count: reviewsSentToday } = await supabaseAdmin
      .from('review_requests').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('sent_at', todayStart.toISOString());

    const { count: reviewsReceivedToday } = await supabaseAdmin
      .from('review_requests').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'review_received').gte('converted_at', todayStart.toISOString());

    // Channels — real (WhatsApp-delivered vs manual device-link fallback)
    const { data: cycleReviewRows } = await supabaseAdmin
      .from('review_requests')
      .select('sent_via, status')
      .eq('user_id', userId)
      .gte('sent_at', cycleStartIso);
    let manualChannel = 0;
    let whatsappChannel = 0;
    for (const r of cycleReviewRows || []) {
      const isManual = r?.status === 'manual_fallback' || r?.sent_via === 'manual_link';
      if (isManual) manualChannel += 1;
      else whatsappChannel += 1;
    }

    // ── Recent review requests (per-customer tracking list, last 20)
    //    Agency accounts also see requests their traders sent.
    let recentRequests: any[] = [];
    {
      const base = supabaseAdmin
        .from('review_requests')
        .select('customer_name, customer_phone, status, sent_via, sent_at, converted_at, review_link')
        .order('sent_at', { ascending: false })
        .limit(20);
      if (planTier === 'agency') {
        const agencyPhones = await getAgencyClientPhones(userId);
        if (agencyPhones.length > 0) {
          const { data } = await base.or(`user_id.eq.${userId},agency_client_phone.in.(${agencyPhones.join(',')})`);
          recentRequests = data || [];
        } else {
          const { data } = await base.eq('user_id', userId);
          recentRequests = data || [];
        }
      } else {
        const { data } = await base.eq('user_id', userId);
        recentRequests = data || [];
      }
    }

    // ── Timelines (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: reviewTimelineRows } = await supabaseAdmin
      .from('review_requests')
      .select('converted_at')
      .eq('user_id', userId)
      .eq('status', 'review_received')
      .gte('converted_at', thirtyDaysAgo);

    const postTimelineRows: { kind: 'google' | 'facebook' | 'instagram'; created_at: string }[] = [];
    if (userId) {
      const { data: webRows } = await supabaseAdmin
        .from('posts')
        .select('created_at, social_facebook, social_instagram')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo);
      for (const r of webRows || []) {
        postTimelineRows.push({ kind: 'google', created_at: r.created_at });
        if (r.social_facebook) postTimelineRows.push({ kind: 'facebook', created_at: r.created_at });
        if (r.social_instagram) postTimelineRows.push({ kind: 'instagram', created_at: r.created_at });
      }
    }
    if (phone) {
      const { data: waRows } = await supabaseAdmin
        .from('pending_posts')
        .select('created_at, social_facebook, social_instagram')
        .eq('user_phone', phone)
        .in('status', COMPLETED_POST_STATUSES)
        .not('google_post', 'is', null)
        .gte('created_at', thirtyDaysAgo);
      for (const r of waRows || []) {
        postTimelineRows.push({ kind: 'google', created_at: r.created_at });
        if (r.social_facebook) postTimelineRows.push({ kind: 'facebook', created_at: r.created_at });
        if (r.social_instagram) postTimelineRows.push({ kind: 'instagram', created_at: r.created_at });
      }
    }

    const reviewsMap = bucketize<any>(reviewTimelineRows || [], r => r?.converted_at, 30);
    const googleMap = new Map<string, number>();
    const facebookMap = new Map<string, number>();
    const instagramMap = new Map<string, number>();
    for (const m of [googleMap, facebookMap, instagramMap]) {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        m.set(dayKey(d), 0);
      }
    }
    for (const r of postTimelineRows) {
      const key = dayKey(new Date(r.created_at));
      const target = r.kind === 'facebook' ? facebookMap : r.kind === 'instagram' ? instagramMap : googleMap;
      if (target.has(key)) target.set(key, (target.get(key) || 0) + 1);
    }

    const reviewsTimeline = Array.from(reviewsMap.entries()).map(([date, count]) => ({ date, count }));
    const postsTimeline = Array.from(googleMap.keys()).map(date => ({
      date,
      google: googleMap.get(date) || 0,
      facebook: facebookMap.get(date) || 0,
      instagram: instagramMap.get(date) || 0,
    }));

    const totalSent = reviewsSent || 0;
    const totalReceived = reviewsReceived || 0;
    const conversionRate = totalSent > 0 ? Math.round((totalReceived / totalSent) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        plan: { tier: planTier, name: planInfo.name, daysLeft },
        quota: {
          postsLimit: planInfo.totalPosts,
          postsUsed: usage.total,
          postsDailyLimit: planInfo.dailyPosts,
          postsDailyUsed: usage.daily,
          reviewsLimit: planInfo.totalReviewRequests,
          reviewsUsed: totalSent,
          reviewsDailyLimit: planInfo.dailyReviewRequests,
          reviewsDailyUsed: reviewsSentToday || 0,
        },
        counts: {
          googlePosts: usage.total,
          facebookPosts,
          instagramPosts,
          postsToday: usage.daily,
          reviewsSent: totalSent,
          reviewsReceived: totalReceived,
          reviewsSentToday: reviewsSentToday || 0,
          reviewsReceivedToday: reviewsReceivedToday || 0,
          conversionRate,
        },
        channels: { whatsapp: whatsappChannel, manual: manualChannel },
        timeline: { reviews: reviewsTimeline, posts: postsTimeline },
        recent_requests: recentRequests,
      },
    });
  } catch (error: any) {
    console.error('analytics/stats Error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
