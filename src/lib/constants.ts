export const DOMAIN_PRICE_ONETIME = 19; // One-time custom domain registration (paid plans)
export const WEBSITE_SETUP_PRICE = 99; // One-time website build — FREE for early adopters
export const WEBSITE_HOSTING_MONTHLY = 10; // Hosting per month, after the free window
export const WEBSITE_HOSTING_FREE_DAYS = 90; // Hosting is free for the first 90 days
export const TRIAL_DAYS = 30; // 30 days free trial

export const PRICING_PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    postsPerMonth: 5,
    features: [
      "5 posts per month",
      "5 review requests per month",
      "Google posts + review asks",
      "Send jobs by WhatsApp or the app link"
    ]
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 39,
    postsPerMonth: 25,
    features: [
      "25 posts + 25 review requests per month",
      "Send jobs by WhatsApp or the app link",
      "Your own domain — $19 once",
      "Website builder — $99 setup FREE for early adopters",
      "Website hosting — $10/month, first 90 days free",
      "AI post content, captions & voice notes",
      "Basic analytics"
    ]
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceMonthly: 79,
    postsPerMonth: 60,
    features: [
      "60 posts + 60 review requests per month",
      "Your own domain — $19 once",
      "Website builder — $99 setup FREE for early adopters",
      "Website hosting — $10/month, first 90 days free",
      "Facebook + Instagram content",
      "Priority processing",
      "Advanced analytics + review tracking"
    ]
  },
  agency: {
    id: "agency",
    name: "Agency",
    priceMonthly: 199,
    postsPerMonth: 300,
    features: [
      "Up to 10 traders — each connects their own WhatsApp",
      "300 posts + 300 review requests per month (30 per trader)",
      "One domain per client — $19 each",
      "Website builder per client — $99 setup FREE for early adopters",
      "Hosting $10/month per site, first 90 days free",
      "Google + Facebook + Instagram posts for every trader",
      "Agency overview dashboard + priority support"
    ]
  }
};

export const FAQ_ITEMS = [
  {
    question: "What happens after my trial?",
    answer: "You can stay on the Free plan (5 posts + 5 review asks a month) or upgrade to a paid plan anytime for more posts and your own domain and website."
  },
  {
    question: "Can I change plans later?",
    answer: "Absolutely. Upgrade or downgrade between Free, Pro, Growth, and Agency at any time from your dashboard."
  },
  {
    question: "Do I own my domain?",
    answer: "Yes, 100%. Your domain is $19 once, registered in your name, and renews at the same price. Transfer it out anytime with zero restrictions."
  },
  {
    question: "Is the website extra?",
    answer: "Your domain is $19 once. The website build is $99 — free for early adopters. Hosting is $10/month, with the first 90 days free."
  },
  {
    question: "Do I need WhatsApp?",
    answer: "No. Send every job from WhatsApp or from the Neerzy link. Both work the same way. Nothing to download."
  },
  {
    question: "What if my customer has no WhatsApp?",
    answer: "One tap sends the review request by text, or copies your link. The message is ready — you just press send."
  },
  {
    question: "What's included in each post?",
    answer: "Every job gives you a ready Google post, written for you. Once your website is built, the same job keeps your site fresh. Growth and Agency also get Facebook + Instagram posts."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. There are no contracts or commitments. Cancel your subscription in one click from your dashboard."
  },
  {
    question: "Do I need any technical knowledge?",
    answer: "Not at all. Send a text message, photo, or voice note about your latest job. Our AI handles the writing. You just press publish."
  },
  {
    question: "What if I already have a website?",
    answer: "Keep it. Your Neerzy site is a separate, fast, Google-ready presence that grows with every job you send. Nothing to switch or delete."
  }
];
