// lib/plans.ts
export type PlanType = 'free' | 'pro' | 'growth' | 'agency';

export interface PlanLimits {
  name: string;
  price: string;
  trialDays: number;        // Trial period in days
  totalPosts: number;       // Lifetime/billing cycle post limit
  dailyPosts: number;       // Max posts per day
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
    features: [
      '5 WhatsApp posts total',
      '1 post per day limit',
      'Google post generation',
      'Website update generation',
      'Review request generation',
    ],
    color: '#64748B', // Gray
  },
  pro: {
    name: 'Pro',
    price: '$39/mo',
    trialDays: 0,
    totalPosts: 25,
    dailyPosts: 2,
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
    features: [
      '60 posts per month',
      '4 posts per day',
      'Social content generation',
      'Facebook + Instagram content',
      'Priority processing',
      'Advanced analytics',
      'Multi-location support',
      'Review tracking dashboard',
    ],
    color: '#7C3AED', // Purple
  },
  agency: {
    name: 'Agency',
    price: '$199/mo',
    trialDays: 0,
    totalPosts: 250,
    dailyPosts: 2,
    features: [
      '250 posts per month',
      'Up to 10 clients',
      '2 posts/day per client',
      'Client management dashboard',
      'White-label workflow',
      'Bulk workflow tools',
      'Shared team access',
      'Priority support',
    ],
    color: '#10B981', // Emerald
  },
};

export function getRemainingDays(startDate: string, trialDays: number): number {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + trialDays);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getPlan(tier: string | null | undefined): PlanLimits {
  const t = (tier?.toLowerCase() as PlanType) || 'free';
  return PLAN_LIMITS[t] || PLAN_LIMITS.free;
}
