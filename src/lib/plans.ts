// lib/plans.ts
export type PlanType = 'free' | 'pro' | 'growth';

export interface PlanLimits {
  name: string;
  price: string;
  trialDays: number;        // Trial period in days
  totalPosts: number;       // Lifetime post limit
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
      '1 Google Business Profile',
      'Basic post scheduling',
      'Email support',
      'Neerzy branding on posts',
    ],
    color: '#64748B', // Gray
  },
  pro: {
    name: 'Pro',
    price: '$29/mo',
    trialDays: 0,
    totalPosts: 100,
    dailyPosts: 5,
    features: [
      '3 Google Business Profiles',
      'Advanced scheduling & analytics',
      'Priority support',
      'Custom branding removal',
      'Auto-reply templates',
    ],
    color: '#2563EB', // Blue
  },
  growth: {
    name: 'Growth',
    price: '$79/mo',
    trialDays: 0,
    totalPosts: -1,     // -1 = unlimited
    dailyPosts: 20,
    features: [
      'Unlimited Google Business Profiles',
      'Team collaboration (5 seats)',
      'Dedicated account manager',
      'API access',
      'White-label reporting',
      'Custom integrations',
    ],
    color: '#7C3AED', // Purple
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
