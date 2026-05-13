// lib/plans.ts
export type PlanTier = 'free' | 'starter' | 'pro' | 'unlimited';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  price: number;
  postLimit: number;
  features: string[];
  description: string;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free Trial',
    price: 0,
    postLimit: 5,
    features: ['5 Google Posts', 'Basic SEO', 'WhatsApp Support'],
    description: 'Perfect for trying out Neerzy.'
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 49,
    postLimit: 20,
    features: ['20 Google Posts/mo', 'Enhanced SEO', 'Priority WhatsApp'],
    description: 'Great for growing local businesses.'
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: 99,
    postLimit: 50,
    features: ['50 Google Posts/mo', 'Advanced SEO', 'Review Automation'],
    description: 'For businesses that want to dominate.'
  },
  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    price: 199,
    postLimit: 1000, // Effectively unlimited
    features: ['Unlimited Posts', 'Custom SEO Strategy', 'White-glove Setup'],
    description: 'The ultimate visibility package.'
  }
};

export function getPlan(tier: string | null | undefined): PlanConfig {
  const t = (tier?.toLowerCase() as PlanTier) || 'free';
  return PLANS[t] || PLANS.free;
}
