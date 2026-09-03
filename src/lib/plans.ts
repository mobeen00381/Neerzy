// lib/plans.ts
export type PlanType = 'free' | 'pro' | 'growth' | 'agency';

export interface PlanLimits {
  name: string;
  price: string;
  trialDays: number;        // Trial period in days
  totalPosts: number;       // Lifetime/billing cycle post limit
  dailyPosts: number;       // Max posts per day
  totalReviewRequests: number; // Lifetime/billing cycle review request limit
  dailyReviewRequests: number; // Max review requests per day
  features: string[];       // Feature list
  color: string;            // Card accent color
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    name: 'Free',
    price: '$0/mo',
    trialDays: 30,
    totalPosts: 5,
    dailyPosts: 1,
    totalReviewRequests: 5,
    dailyReviewRequests: 1, // Free trial: 1 review request per day
    features: [
      '5 posts per month',
      '5 review requests per month',
      '1 post per day limit',
      'Google post generation',
    ],
    color: '#64748B', // Gray
  },
  pro: {
    name: 'Pro',
    price: '$39/mo',
    trialDays: 0,
    totalPosts: 25,
    dailyPosts: 2,
    totalReviewRequests: 25,
    dailyReviewRequests: 2,
    features: [
      '25 posts per month',
      '2 posts per day',
      'WhatsApp workflow',
      'Google post generation',
      'Custom domain support',
      'AI post content & captions',
      'Voice note support',
      'Basic analytics',
    ],
    color: '#2563EB', // Blue
  },
  growth: {
    name: 'Growth',
    price: '$79/mo',
    trialDays: 0,
    totalPosts: 60,
    dailyPosts: 4,
    totalReviewRequests: 60,
    dailyReviewRequests: 4,
    features: [
      '60 posts per month',
      '4 posts per day',
      'Social content generation',
      'Facebook + Instagram content',
      'Priority processing',
      'Advanced analytics',
      'Review tracking dashboard',
    ],
    color: '#7C3AED', // Purple
  },
  agency: {
    name: 'Agency',
    price: '$199/mo',
    trialDays: 0,
    totalPosts: 300,
    dailyPosts: 30,
    totalReviewRequests: 300,
    dailyReviewRequests: 30,
    features: [
      'Up to 10 traders — each connects their own WhatsApp',
      '300 posts per month (30 per trader)',
      '300 review requests per month (30 per trader)',
      '3 posts/day per trader',
      'Google + Facebook + Instagram posts for every trader',
      'Agency overview dashboard',
      'Priority processing',
      'Priority support',
    ],
    color: '#10B981', // Emerald
  },
};

export function getRemainingDays(startDate: string, trialDays: number): number {
  if (!startDate || trialDays <= 0) return 0;
  try {
    const start = new Date(startDate);
    // Guard: if the start date is invalid or in the future, return 0
    if (isNaN(start.getTime())) return 0;
    const now = new Date();
    // If start date is somehow in the future, clamp to now
    const effectiveStart = start > now ? now : start;
    const end = new Date(effectiveStart);
    end.setDate(end.getDate() + trialDays);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

export function getPlan(tier: string | null | undefined): PlanLimits {
  const t = (tier?.toLowerCase() as PlanType) || 'free';
  return PLAN_LIMITS[t] || PLAN_LIMITS.free;
}

const BILLING_CYCLE_DAYS = 30;

/**
 * Returns the ISO start of the user's current 30-day billing cycle.
 * The cycle is anchored to the user's plan-start / onboarding date, so a user
 * who onboards on the 5th (or 10th, 18th, ...) gets a fresh quota every 30 days
 * from that date. All plans (free + paid) follow this monthly cycle.
 *
 * Pass `plan_started_at || trial_started_at || created_at` as the anchor.
 */
export function getCycleStartIso(anchorIso?: string | null, now = new Date()): string {
  if (!anchorIso) return now.toISOString();
  const anchor = new Date(anchorIso);
  if (isNaN(anchor.getTime())) return now.toISOString();
  if (now.getTime() < anchor.getTime()) return now.toISOString();
  const cycleMs = BILLING_CYCLE_DAYS * 24 * 60 * 60 * 1000;
  const cycles = Math.floor((now.getTime() - anchor.getTime()) / cycleMs);
  return new Date(anchor.getTime() + cycles * cycleMs).toISOString();
}
