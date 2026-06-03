export const DOMAIN_PRICE_YEARLY = 20;
export const TRIAL_DAYS = 30; // 30 days free trial

export const PRICING_PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    postsPerMonth: 5,
    features: [
      "5 WhatsApp posts total",
      "1 post per day limit",
      "Google post generation",
      "Website update generation",
      "Review request generation"
    ]
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 39,
    postsPerMonth: 25,
    features: [
      "25 posts per month + review requests",
      "25 review requests-extra",
      "WhatsApp workflow",
      "Custom domain support",
      "Voice note support"
    ]
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceMonthly: 79,
    postsPerMonth: 60,
    features: [
      "60 posts per month + review requests",
      "60 review requests-extra",
      "Social content generation",
      "Priority processing",
      "Advanced analytics"
    ]
  },
  agency: {
    id: "agency",
    name: "Agency",
    priceMonthly: 199,
    postsPerMonth: 250,
    features: [
      "250 posts per month + review requests",
      "250 review requests-extra",
      "White-label options",
      "Dedicated account manager",
      "API access"
    ]
  }
};

export const FAQ_ITEMS = [
  {
    question: "What happens after my trial?",
    answer: "You can continue on the Free plan or upgrade to a paid tier anytime to unlock more posts and features."
  },
  {
    question: "Can I change plans later?",
    answer: "Absolutely. Upgrade or downgrade between Free, Pro, and Growth at any time from your dashboard."
  },
  {
    question: "Do I own my domain?",
    answer: "Yes, 100%. The domain is registered in your name. You can transfer it out anytime with zero restrictions — no questions asked."
  },
  {
    question: "What's included in each AI post?",
    answer: "Every AI post includes a professionally written blog article for your website AND a Google Business Profile update, both auto-optimized for local SEO keywords."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. There are no contracts or commitments. Cancel your subscription in one click from your dashboard."
  },
  {
    question: "Do I need any technical knowledge?",
    answer: "Not at all. Just send a text message, photo, or voice note about your latest job. Our AI handles everything — writing, publishing, and SEO optimization."
  },
  {
    question: "What if I already have a website?",
    answer: "We can work alongside your existing website or replace it entirely. Your Neerzy site is a separate, optimized presence that boosts your local search rankings."
  },
  {
    question: "How does the AI assistant work?",
    answer: "Send a message, upload a photo, or record a voice note about your completed project. The AI instantly writes a professional SEO-optimized post and publishes it to your website and Google Business Profile."
  }
];
