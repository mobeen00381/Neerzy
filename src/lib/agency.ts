// lib/agency.ts
// Simplified Agency plan: 1 agency account manages up to 10 traders.
// Pool:   300 posts + 300 review requests per month, 30/day.
// Trader: 30 posts + 30 review requests per month, 3/day each.
// Every trader generates Google + Facebook + Instagram content.

import { createClient } from '@supabase/supabase-js';
import { countUserPosts } from '@/lib/post-usage';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const AGENCY_MAX_CLIENTS = 10;

export const AGENCY_POOL = {
  posts: 300,
  postsDaily: 30,
  reviews: 300,
  reviewsDaily: 30,
};

export const AGENCY_TRADER = {
  posts: 30,
  postsDaily: 3,
  reviews: 30,
  reviewsDaily: 3,
};

export interface AgencyContext {
  agencyUserId: string;
  agencyAnchor: string; // plan_started_at || trial_started_at || created_at
  clientPhone: string;
  clientName?: string | null;
  clientId: string;
}

/** Returns agency context when `phone` is a trader registered under an agency. */
export async function getAgencyByClientPhone(phone: string): Promise<AgencyContext | null> {
  if (!phone) return null;
  const normalized = phone.replace(/\s+/g, '');
  try {
    const { data: client } = await supabaseAdmin
      .from('agency_clients')
      .select('id, agency_user_id, client_phone, client_name, status')
      .eq('client_phone', normalized)
      .maybeSingle();
    if (!client) return null;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('plan_started_at, trial_started_at, created_at, selected_plan')
      .eq('id', client.agency_user_id)
      .maybeSingle();

    // Only treat the phone as an agency trader if the owner is actually on the
    // agency plan — otherwise ignore the mapping.
    if (!profile || (profile.selected_plan || 'free').toLowerCase() !== 'agency') return null;

    return {
      agencyUserId: client.agency_user_id,
      agencyAnchor: profile.plan_started_at || profile.trial_started_at || profile.created_at || new Date().toISOString(),
      clientPhone: normalized,
      clientName: client.client_name || null,
      clientId: client.id,
    };
  } catch (err) {
    console.warn('⚠️ getAgencyByClientPhone error:', err);
    return null;
  }
}

/** All client phone numbers for an agency. */
export async function getAgencyClientPhones(agencyUserId: string): Promise<string[]> {
  try {
    const { data } = await supabaseAdmin
      .from('agency_clients')
      .select('client_phone')
      .eq('agency_user_id', agencyUserId);
    return (data || []).map(r => r.client_phone);
  } catch (err) {
    console.warn('⚠️ getAgencyClientPhones error:', err);
    return [];
  }
}

const COMPLETED_POST_STATUSES = ['generated', 'published'];

/**
 * Agency pool post usage (this billing cycle + today) across every trader phone
 * AND the agency owner's own dashboard posts. Only completed posts count.
 */
export async function countAgencyPoolPosts(
  agencyUserId: string,
  cycleStartIso: string
): Promise<{ total: number; daily: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  let total = 0;
  let daily = 0;

  // Agency owner's own dashboard posts
  const { count: ownTotal, error: e1 } = await supabaseAdmin
    .from('posts').select('*', { count: 'exact', head: true })
    .eq('user_id', agencyUserId).gte('created_at', cycleStartIso);
  const { count: ownDaily, error: e2 } = await supabaseAdmin
    .from('posts').select('*', { count: 'exact', head: true })
    .eq('user_id', agencyUserId).gte('created_at', todayIso);
  if (!e1 && ownTotal !== null) total += ownTotal;
  if (!e2 && ownDaily !== null) daily += ownDaily;

  // Traders' WhatsApp posts
  const phones = await getAgencyClientPhones(agencyUserId);
  if (phones.length > 0) {
    const { count: tTotal, error: e3 } = await supabaseAdmin
      .from('pending_posts').select('*', { count: 'exact', head: true })
      .in('user_phone', phones).in('status', COMPLETED_POST_STATUSES)
      .not('google_post', 'is', null).gte('created_at', cycleStartIso);
    const { count: tDaily, error: e4 } = await supabaseAdmin
      .from('pending_posts').select('*', { count: 'exact', head: true })
      .in('user_phone', phones).in('status', COMPLETED_POST_STATUSES)
      .not('google_post', 'is', null).gte('created_at', todayIso);
    if (!e3 && tTotal !== null) total += tTotal;
    if (!e4 && tDaily !== null) daily += tDaily;
  }

  return { total, daily };
}

/**
 * Agency pool review-request usage — owner-sent (user_id) + trader-sent
 * (agency_client_phone in client list).
 */
export async function countAgencyPoolReviews(
  agencyUserId: string,
  phones: string[],
  cycleStartIso: string
): Promise<{ total: number; daily: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  let total = 0;
  let daily = 0;

  const addCounts = async (base: any, sinceIso: string) => {
    const { count } = await base.gte('sent_at', sinceIso);
    return count || 0;
  };

  const ownC = supabaseAdmin.from('review_requests').select('*', { count: 'exact', head: true }).eq('user_id', agencyUserId);
  const traderC = supabaseAdmin.from('review_requests').select('*', { count: 'exact', head: true }).in('agency_client_phone', phones);
  total += await addCounts(ownC, cycleStartIso);
  daily += await addCounts(ownC, todayIso);
  if (phones.length > 0) {
    total += await addCounts(traderC, cycleStartIso);
    daily += await addCounts(traderC, todayIso);
  }
  return { total, daily };
}

/** Per-trader post usage (countUserPosts semantics keyed by phone only). */
export async function countAgencyTraderPosts(phone: string, cycleStartIso: string) {
  return countUserPosts(null, phone, cycleStartIso);
}

/** Per-trader review usage from agency_client_phone tracking column. */
export async function countAgencyTraderReviews(phone: string, cycleStartIso: string): Promise<{ total: number; daily: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: total, error: e1 } = await supabaseAdmin
    .from('review_requests').select('*', { count: 'exact', head: true })
    .eq('agency_client_phone', phone).gte('sent_at', cycleStartIso);
  const { count: daily, error: e2 } = await supabaseAdmin
    .from('review_requests').select('*', { count: 'exact', head: true })
    .eq('agency_client_phone', phone).gte('sent_at', today.toISOString());
  return { total: e1 ? 0 : (total || 0), daily: e2 ? 0 : (daily || 0) };
}

