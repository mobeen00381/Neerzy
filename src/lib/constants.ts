export const DOMAIN_PRICE_YEARLY = 20;
export const TRIAL_DAYS = 30; // 30 days free trial

export const PRICING_PLANS = {
  basic: {
    id: "basic",
    name: "Basic",
    priceMonthly: 19.99,
    postsPerMonth: 10,
    features: [
      "Done-For-You Generated Website",
      "10 AI Posts / Month (Website & GMB)",
      "Native AI Assistant Messaging",
      "Voice Note & Image Uploads",
      "Free Domain Transfer Anytime"
    ]
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 39.99,
    postsPerMonth: 30,
    features: [
      "Done-For-You Generated Website",
      "30 AI Posts / Month (Website & GMB)",
      "Priority AI Response Modeling",
      "Active Google Business Management",
      "Voice Note & Image Uploads",
      "Free Domain Transfer Anytime",
      "Dedicated Chat Support"
    ]
  }
};

export const FAQ_ITEMS = [
  {
    question: "What happens after my 30-day free trial?",
    answer: "You'll be automatically charged your plan price. You can cancel anytime before the trial ends and you won't be charged a single penny."
  },
  {
    question: "Can I change plans later?",
    answer: "Absolutely. Upgrade from Basic to Pro or downgrade at any time. Changes take effect on your next billing cycle."
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
