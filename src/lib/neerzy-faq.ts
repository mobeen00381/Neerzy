/**
 * Neerzy FAQ Knowledge Base — Zero-Token Instant Answers
 * 
 * This module provides:
 * 1. matchFAQ(message) — returns a pre-written answer for common questions (zero API cost)
 * 2. isNeerzyRelated(message) — keyword gate that checks if a query is Neerzy/business-related
 * 3. OFF_TOPIC_RESPONSE — polite rejection message for non-Neerzy queries
 */

// ─────────────────────────────────────────────────────
// FAQ Entries
// ─────────────────────────────────────────────────────

interface FAQEntry {
  patterns: string[];   // lowercase substrings/phrases to match against
  answer: string;
}

const FAQ_DATABASE: FAQEntry[] = [
  // ── What is Neerzy ──
  {
    patterns: ['what is neerzy', 'about neerzy', 'tell me about neerzy', 'what does neerzy do', 'explain neerzy'],
    answer: `Neerzy is an AI-powered platform built for local businesses like plumbers, HVAC techs, electricians, roofers, dentists, and more. 🚀

Here's how it works:
1. 📸 Snap a photo or record a voice note of a job you just finished
2. 🤖 Neerzy's AI turns it into a ready Google post — and the review ask for your customer
3. 🌐 It goes to your Google Business Profile, and keeps your Neerzy website fresh

Send from WhatsApp or from your Neerzy link — both work the same. No apps to download, nothing new to learn.`
  },
  {
    patterns: ['how does neerzy work', 'how it works', 'how neerzy works'],
    answer: `It's super simple — 3 steps:

1. 📱 Send a photo + voice note of your job — on WhatsApp or from the Neerzy link
2. 🤖 Our AI writes the Google post for you
3. 🚀 Publish it in a couple of taps

Add your customer's name and phone number, and Neerzy writes the review ask for you. Customer has no WhatsApp? One tap sends it by text, or copies your link. ⭐`
  },

  // ── Pricing ──
  {
    patterns: ['pricing', 'how much', 'cost', 'price', 'subscription', 'what plans', 'plan options', 'packages'],
    answer: `Here are our plans:

🆓 **Free Plan** — $0/mo
• 5 posts/month (1/day) • 5 review requests/month (1/day)
• Google posts + review asks
• Send jobs by WhatsApp or the app link
• 30-day free trial

💼 **Pro Plan** — $39/mo
• 25 posts/month (2/day) • 25 review requests/month (2/day)
• Send jobs by WhatsApp or the app link
• Your own domain — $19 once
• Website builder — $99 setup FREE for early adopters
• Website hosting — $10/month, first 90 days free
• AI captions & voice notes • Basic analytics

🚀 **Growth Plan** — $79/mo
• 60 posts/month (4/day) • 60 review requests/month (4/day)
• Your own domain — $19 once
• Website builder — $99 setup FREE for early adopters
• Website hosting — $10/month, first 90 days free
• Facebook + Instagram content • Priority processing
• Advanced analytics + review tracking

🏢 **Agency Plan** — $199/mo
• Up to 10 traders — each connects their own WhatsApp
• 300 posts + 300 review requests/month (30 per trader)
• One domain per client — $19 each
• Website builder for every client — setup FREE for early adopters
• Google + Facebook + Instagram posts for every trader
• Agency overview dashboard • Priority processing & support

💡 Your own domain is $19 once. The Free plan gives you Google posts and review asks — no domain or website.
👉 Start here: /onboarding`
  },
  {
    patterns: ['free plan', 'free tier', 'free version', 'is it free', 'free trial'],
    answer: `Yes! Our **Free Plan** is completely free — $0/month! 🎉

It includes:
• 5 posts per month (1/day)
• 5 review requests per month (1/day)
• Google posts + review asks
• Send jobs by WhatsApp or the app link
• **30-day free trial** to explore everything

The Free plan does not include a custom domain or a website. No credit card required to start. 👉 Get started at /onboarding`
  },
  {
    patterns: ['pro plan', 'pro tier', '$39'],
    answer: `The **Pro Plan** is $39/month and includes:

• 25 posts per month (2 per day)
• 25 review requests per month (2 per day)
• Send jobs by WhatsApp or the app link
• Your own domain — $19 once
• Website builder — $99 setup FREE for early adopters
• Website hosting — $10/month, first 90 days free
• AI-powered content & captions
• Voice note support
• Basic analytics

Perfect for individual contractors and small businesses! 👉 /onboarding`
  },
  {
    patterns: ['growth plan', 'growth tier', '$79'],
    answer: `The **Growth Plan** is $79/month — our most popular! 🚀

• 60 posts per month (4 per day)
• 60 review requests per month (4 per day)
• Your own domain — $19 once
• Website builder — $99 setup FREE for early adopters
• Website hosting — $10/month, first 90 days free
• Social content generation (Facebook + Instagram)
• Priority processing
• Advanced analytics + review tracking

Ideal for growing businesses that want to dominate local search. 👉 /onboarding`
  },
  {
    patterns: ['agency plan', 'agency tier', '$199', 'multiple clients', '10 traders'],
    answer: `The **Agency Plan** is $199/month — built for marketing agencies managing up to 10 traders:

• Up to 10 traders — each connects their own WhatsApp
• 300 posts + 300 review requests per month (30 per trader)
• One domain per client — $19 each
• Website builder for every client — setup FREE for early adopters
• Google + Facebook + Instagram posts for every trader
• Agency overview dashboard
• Priority processing & priority support

Every trader uses the exact same simple WhatsApp flow — you just watch it all from your agency overview. 👉 /onboarding`
  },

  // ── Domain ──
  {
    patterns: ['domain', 'custom domain', 'domain fee', 'domain cost', '$19', 'domain price', 'how much is the domain'],
    answer: `Your own domain costs a one-time **$19**. You get it for your Neerzy website (e.g., yourcompany.com).

• Registered and connected for you
• Padlock (SSL) included
• Renews at the same price

Once your domain is live you can tap **Build Website** in your dashboard:
• **$99 setup fee** — waived FREE for early adopters 🎉
• **$10/month hosting** — free for your first 90 days, then $10/month

Your website auto-updates every time you post. No website builder needed! 🌐`
  },

  // ── Trial ──
  {
    patterns: ['trial', '30 day', 'try neerzy', 'test it', 'try it'],
    answer: `The **Free Plan** comes with a **30-day free trial** — no credit card required! 🎉

During the trial you get:
• 5 posts per month
• 5 review requests per month
• Google posts + review asks
• Send jobs by WhatsApp or the app link

After the trial, you can upgrade to Pro ($39/mo), Growth ($79/mo), or Agency ($199/mo) — or stay on Free with your remaining posts. 👉 /onboarding`
  },

  // ── Cancellation ──
  {
    patterns: ['cancel', 'cancellation', 'cancel anytime', 'refund', 'stop subscription', 'unsubscribe'],
    answer: `You can **cancel anytime** — no contracts, no lock-in. 🙌

Simply go to your Dashboard → Settings → Subscription and cancel. Your account will remain active until the end of your billing period.

For refund requests, email us at support@neerzy.com.`
  },

  // ── Who is it for ──
  {
    patterns: ['who is it for', 'who can use', 'what businesses', 'target audience', 'for plumbers', 'for hvac', 'for electricians', 'for contractors'],
    answer: `Neerzy is built for **local service businesses**, including:

🔧 Plumbers
❄️ HVAC Technicians
⚡ Electricians
🏠 Roofers & Handymen
🦷 Dentists
🧹 Cleaning Services
🌿 Landscapers
🔑 Locksmiths
…and any local business that wants more Google visibility and customer reviews!`
  },

  // ── WhatsApp is optional ──
  {
    patterns: ['customer no whatsapp', 'customer without whatsapp', "customer doesn't have whatsapp", "customer doesnt have whatsapp", "customer doesn't use whatsapp", "customer doesnt use whatsapp", 'customer does not use whatsapp', 'customer does not have whatsapp', 'customer not on whatsapp', 'client does not use whatsapp', 'client no whatsapp', 'no whatsapp on their phone', 'sms', 'text message', 'send a text', 'copy the link'],
    answer: `No problem at all. 🙌
Every review ask has three ways out:
• Send it on **WhatsApp**
• Send it by **text (SMS)**
• **copy the link** and paste it anywhere

The message is written for you first — you just press send. ⭐`
  },
  {
    patterns: ['do i need whatsapp', 'need whatsapp', 'without whatsapp', 'is whatsapp required', 'whatsapp required', 'dont have whatsapp', "don't have whatsapp", 'not on whatsapp', 'whatsapp needed'],
    answer: `No — WhatsApp is optional. 🙌
Send every job from **WhatsApp** or from your **Neerzy link**. Both work the same.

The Neerzy link opens in any browser. Save it to your home screen and it works like an app — nothing to download, no app store needed.`
  },

  // ── WhatsApp ──
  {
    patterns: ['whatsapp', 'how to post', 'send photo', 'voice note', 'how to use whatsapp'],
    answer: `Using Neerzy via WhatsApp is easy:

1. 📸 Send a photo of your completed job
2. 🎤 Optionally send a voice note describing the work
3. Type **POST** to generate your AI content
4. Copy the text and post it to your Google Business Profile

You can also send customer details (name + phone) and type **DONE** to automatically send a review request! ⭐`
  },

  // ── Reviews ──
  {
    patterns: ['review', 'reviews', 'review request', 'get reviews', 'google review', 'customer review'],
    answer: `Neerzy makes getting reviews effortless! ⭐

After finishing a job:
1. Send the customer's name and phone number — on WhatsApp or from the Neerzy link
2. Type **DONE**
3. Neerzy writes the review ask for you

Send it on **WhatsApp**, send it by **text**, or **copy the link** and paste it anywhere. The message is ready — you just press send.

The link goes straight to your Google reviews. More 5-star reviews = higher on Maps! 📈`
  },

  // ── Google Business Profile ──
  {
    patterns: ['google business', 'gbp', 'google maps', 'google profile', 'google my business', 'connect google'],
    answer: `Neerzy syncs with your **Google Business Profile** (Google Maps listing).

When you create a post through Neerzy, we generate SEO-optimized content that you can publish directly to your GBP. This helps you:
• Rank higher in local search 📈
• Show up on Google Maps 🗺️
• Get more customer calls 📞

Connect your GBP during onboarding at /onboarding`
  },

  // ── SEO ──
  {
    patterns: ['seo', 'search engine', 'rank higher', 'google ranking', 'local seo'],
    answer: `Neerzy is built for **Local SEO**! Every post we generate is:

✅ Keyword-optimized for your service area
✅ Formatted for Google Business Profile
✅ Published to your Neerzy website with proper meta tags
✅ Structured with schema markup for rich search results

The more you post, the higher you rank. Businesses using Neerzy typically see improved local visibility within weeks! 📈`
  },

  // ── Website (specific questions first, then general) ──
  {
    patterns: ['without website', 'no website', "don't have website", 'do not have website', 'need a website', 'do i need website', 'start without', 'without a website'],
    answer: `Yes! You can absolutely start without a website!

Neerzy is designed for businesses that may not have a website yet. Here's how it works:

• 📸 Just send a photo on WhatsApp — or from the Neerzy link — after each job
• 🤖 Neerzy's AI writes the Google post for you
• 🌐 Add your own domain ($19 once) and tap **Build Website** when you're ready
• 📈 Your work stays fresh on your Google Business Profile

You don't need any existing website or technical skills. 👉 /onboarding`
  },
  {
    patterns: ['website', 'my website', 'neerzy website', 'auto website', 'landing page', 'build website', 'build a website', 'website cost', 'website fee', 'website price', 'website extra', 'website included', 'is the website extra', 'hosting'],
    answer: `You can build your own website right from the dashboard! 🌐

1. First claim your **domain** (one-time $19)
2. Then tap **Build Website**
3. **$99 setup fee — FREE for early adopters**
4. **Hosting $10/month** — free for your first 90 days, then $10/month

Every website is:
• Automatically updated with every post you create
• SEO-optimized with proper meta tags and schema markup
• Mobile-responsive design
• No coding or website builder needed

The Free plan gives you Google posts and review asks. Your domain and website start on a paid plan.`
  },

  // ── Support / Contact ──
  {
    patterns: ['support', 'help', 'contact', 'email', 'phone number', 'customer service'],
    answer: `Need help? We're here for you! 💙

📧 Email: support@neerzy.com
💬 Chat: You're already talking to our AI assistant!
📱 WhatsApp: Use the same number you post with

Pro tip: Growth and Agency plans get priority support! 🚀`
  },

  {
    patterns: ['compare', 'compare plans', 'which plan', 'what plan should', 'best plan for me', 'recommend a plan', 'recommend', 'difference between', 'free vs', 'vs pro', 'vs growth', 'vs agency', 'upgrade', 'downgrade', 'switch plan', 'change plan'],
    answer: `Here's a quick comparison to help you choose:

🆓 **Free** - $0/mo: 5 posts + 5 review requests per month. Google posts and review asks, by WhatsApp or the Neerzy link. Includes the 30-day trial.
💼 **Pro** - $39/mo: Your own domain — $19 once, website builder ($99 setup FREE for early adopters, then $10/mo hosting), 25 posts + 25 review requests per month, AI captions, voice notes, basic analytics. Best for a single contractor posting every day.
🚀 **Growth** - $79/mo: Your own domain and website builder on the same terms as Pro, plus 60 posts + 60 review requests per month, Facebook & Instagram posts, priority processing, advanced analytics and review tracking. Best for growing businesses.
🏢 **Agency** - $199/mo: up to 10 traders, 300 posts + 300 review requests per month (30 per trader), a domain and website for each client, Google + Facebook + Instagram for every trader, agency dashboard. Best for marketing agencies.

Starting out? The **Free Plan** with its 30-day trial is the safest pick - you can upgrade anytime. 👉 /onboarding`
  },
  {
    patterns: ['how many posts', 'post limit', 'posts per day', 'posts per month', 'max posts', 'how many reviews', 'review limit', 'daily limit', 'monthly limit', 'posting limit'],
    answer: `Here are your posting and review limits per plan:

🆓 **Free** - 5 posts/month (1/day) • 5 review requests/month (1/day)
💼 **Pro** - 25 posts/month (2/day) • 25 review requests/month (2/day)
🚀 **Growth** - 60 posts/month (4/day) • 60 review requests/month (4/day)
🏢 **Agency** - 300 posts + 300 review requests/month across up to 10 traders (30 per trader)

Limits refresh each month. 👉 /onboarding`
  },
  {
    patterns: ['analytics', 'dashboard', 'report', 'reports', 'review tracking', 'see my posts', 'view my posts', 'track my posts', 'stats'],
    answer: `Analytics depend on your plan:

• **Free / Pro** - basic analytics in your dashboard
• **Growth** - advanced analytics + a review tracking dashboard
• **Agency** - an agency overview dashboard showing every trader's activity in one place

You can always see your generated posts and review activity from your Neerzy dashboard. 📊`
  },
  {
    patterns: ['connect whatsapp', 'link whatsapp', 'add whatsapp', 'setup whatsapp', 'set up whatsapp', 'connect to whatsapp'],
    answer: `Connecting WhatsApp is part of onboarding:

1. Sign up at /onboarding and pick your plan
2. Follow the "Connect WhatsApp" step - you'll receive a QR code / invite on your phone
3. Accept it and you're connected: send photos + voice notes to the Neerzy number and type POST

If you get stuck at any step, email support@neerzy.com and we'll walk you through it.`
  },
  {
    patterns: ['no photo', 'without a photo', 'without photo', 'text only', 'just text', 'no pictures', 'can i type', 'need a photo', 'do i need', 'need photos', 'photo required', 'photos required'],
    answer: `Yes, you can post without a photo! ✅ Just send a text or voice note describing the job and type POST.

Photos help your posts stand out (posts with photos usually perform better), but a clear description is enough to generate your post.`
  },
  {
    patterns: ['facebook', 'instagram', 'social media', 'social content', 'social posts', 'fb', 'ig', 'linkedin', 'twitter', 'tiktok'],
    answer: `Social posting depends on your plan:

• **Free & Pro** - Google posts (plus your Neerzy website on Pro, once you build it)
• **Growth & Agency** - you also get **Facebook + Instagram** posts for the same job

If you want every job shared to Facebook & Instagram automatically, Growth (or Agency) is the plan for you. 👉 /onboarding`
  },
  {
    patterns: ['publish', 'auto post', 'automatically post', 'does neerzy post', 'does it post', 'who writes the post', 'post for me', 'automatic posting'],
    answer: `Neerzy does the writing for you.

You send a photo or voice note → Neerzy's AI writes the SEO-optimised post → it's ready to publish to your Google Business Profile, and it updates your Neerzy website once you've built it. On Growth/Agency it also creates your Facebook + Instagram posts from the same job.`
  },

  {
    patterns: ['where are you based', 'where is neerzy based', 'where are you located', 'where is neerzy located', 'what country are you in', 'which country are you in', 'are you in the uk', 'uk based', 'are you a uk company'],
    answer: `We're a real software company - **Neerzy AI Ltd** - and you can find our business address on the Contact page of our website. 🌍

We build and support Neerzy for local businesses (plumbers, HVAC, electricians, roofers, dentists, and more), and the chat assistant is available right here whenever you need us. For anything else, support@neerzy.com is fastest.`
  },

  // ── Greetings ──
  {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'howdy'],
    answer: `Hey there! 👋 Welcome to Neerzy! I'm your AI assistant.

I can help you with:
• 💰 Pricing and plans
• 🚀 How Neerzy works
• ⭐ Review management
• 🌐 Google Business & SEO
• 📱 WhatsApp posting

What would you like to know?`
  },

  {
    patterns: ['existing website', 'keep my website', 'already have a website', 'already have website', 'own website', 'old website', 'my own domain', 'already have a domain', 'own domain'],
    answer: `You don't need to switch or remove anything you already have. ✅

Neerzy builds its own auto-updated site on a custom domain (one-time $19 fee) and keeps your Google Business Profile fresh. It works alongside any website you already own - most customers use Neerzy as their main marketing engine while keeping their old site live.`
  },
  {
    patterns: ['booking', 'appointment', 'schedule jobs', 'send quotes', 'send an estimate', 'estimates', 'quotes', 'invoices', 'invoice customers', 'job management', 'crm'],
    answer: `Great question! Neerzy focuses on **marketing** - turning your finished jobs into Google posts, social posts, and website content, plus automating review requests.

It doesn't schedule jobs, send quotes, or manage invoices. If you need those too, pair Neerzy with your existing scheduling / invoicing app - Neerzy handles the online presence side. 😊`
  },
  {
    patterns: ['customize', 'customise', 'branding', 'my logo', 'logo', 'colors', 'edit my website', 'change the design', 'template', 'themes'],
    answer: `Your Neerzy website is automatically generated from your business info and every post you publish - mobile-responsive and SEO-ready out of the box.

For questions about customising colours, logos, or specific branding, email support@neerzy.com and the team will advise what's possible for your plan. 🎨`
  },
  {
    patterns: ['legit', 'legitimate', 'trust', 'trustworthy', 'scam', 'is neerzy real', 'real company', 'safe', 'secure', 'reliable', 'genuine'],
    answer: `Neerzy is a real SaaS company - you'll find our business details on the Contact page. 💙

• Transparent pricing: your own domain is $19 once, the website build is $99 (free for early adopters), and hosting is $10/month after 90 free days
• Cancel anytime - no contracts
• 30-day free trial so you can see results before paying
• Real support at support@neerzy.com

Happy to answer any specific concern - just ask!`
  },
  {
    patterns: ['what countries', 'which countries', 'outside the uk', 'another country', 'other countries', 'languages', 'another language', 'non-english', 'in french', 'in spanish'],
    answer: `Neerzy is built for local businesses and currently serves English-language content. ✈️

If you're based somewhere we don't cover yet or need content in another language, email support@neerzy.com and we'll confirm what's possible for your situation.`
  },
  {
    patterns: ['get started', 'how do i sign up', 'signing up', 'start now', 'set up my account', 'what happens after signup', 'first step'],
    answer: `Getting started takes about 2 minutes:

1. 👉 Head to /onboarding
2. Pick a plan (Free includes a 30-day trial - no credit card needed)
3. Pay the one-time $19 domain fee to claim your custom domain
4. Connect WhatsApp and your Google Business Profile
5. Optional: tap **Build Website** in the dashboard — $99 setup is FREE for early adopters, and hosting is $10/month (free for your first 90 days)
6. Finish your first job → send a photo → type POST 🎉

If you hit any snag, support@neerzy.com is here to help.`
  },

  // ── Thanks ──
  {
    patterns: ['thank', 'thanks', 'thank you', 'appreciate'],
    answer: `You're welcome! 😊 Happy to help!

If you have more questions, just ask. When you're ready to get started, head to 👉 /onboarding

Have a great day! 🚀`
  },
];

// ─────────────────────────────────────────────────────
// Neerzy-Related Topic Keywords
// ─────────────────────────────────────────────────────

const NEERZY_KEYWORDS = [
  // Brand
  'neerzy',
  // Business / Marketing
  'business', 'marketing', 'local business', 'contractor', 'service',
  'plumber', 'hvac', 'electrician', 'roofer', 'handyman', 'dentist',
  'cleaning', 'landscap', 'locksmith',
  // Product features
  'post', 'posting', 'whatsapp', 'voice note', 'photo', 'image',
  'review', 'reviews', 'customer', 'client',
  'website', 'domain', 'seo', 'search engine', 'ranking', 'rank',
  'build website', 'website builder', 'hosting', 'sms', 'text message', 'no whatsapp',
  'google', 'gbp', 'google maps', 'google business',
  'content', 'blog', 'caption', 'hashtag',
  'analytics', 'dashboard', 'workflow',
  // Pricing / Account
  'plan', 'pricing', 'price', 'cost', 'subscription', 'trial', 'free',
  'pro', 'growth', 'agency', 'upgrade', 'downgrade',
  'cancel', 'refund', 'billing', 'payment',
  'signup', 'sign up', 'onboarding', 'account', 'login', 'log in',
  // Support
  'support', 'help', 'contact', 'email',
  // Social
  'facebook', 'instagram', 'social media', 'social content',
  // Greetings (always allow)
  'hello', 'hi', 'hey', 'thanks', 'thank',
  // Extended coverage phrases (Neerzy product conversations)
  'how many posts', 'post limit', 'posts per day', 'posts per month', 'max posts',
  'review request', 'review requests', 'star rating', 'google reviews',
  'connect whatsapp', 'link whatsapp', 'publish', 'auto post', 'automatically post',
  'facebook', 'instagram', 'social media', 'social content',
  'billing', 'payment', 'invoice', 'unsubscribe', 'upgrade', 'downgrade',
  'compare plans', 'which plan', 'best plan', 'recommend a plan', 'difference between',
  'what plan', 'features', 'included', 'what do i get',
  'logo', 'branding', 'customis', 'customiz', 'edit my website',
  'legit', 'legitimate', 'trustworthy', 'scam', 'secure', 'reliable', 'real company',
  'languages', 'another country', 'booking', 'appointment', 'send quotes', 'estimates', 'invoices',
];

// ─────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────

/**
 * Helper: Check if a pattern matches as a whole word/phrase in the message.
 * Uses word boundary matching to avoid false positives (e.g., "hi" matching inside "this").
 * For multi-word patterns, checks if the entire phrase exists in the text.
 */
function wordBoundaryMatch(text: string, pattern: string): boolean {
  // For multi-word patterns, check if the entire phrase exists
  if (pattern.includes(' ')) {
    return text.includes(pattern.toLowerCase());
  }
  
  // For single words, use word boundary regex
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(text);
}

/**
 * Tier 1: Match the user's message against the static FAQ database.
 * Returns the pre-written answer if matched, or null if no match.
 * This costs ZERO tokens.
 */
export function matchFAQ(message: string): string | null {
  const normalized = message.toLowerCase().trim();

  // Skip very short messages (< 2 chars) — likely just punctuation
  if (normalized.length < 2) return null;

  for (const entry of FAQ_DATABASE) {
    for (const pattern of entry.patterns) {
      if (wordBoundaryMatch(normalized, pattern)) {
        return entry.answer;
      }
    }
  }

  return null;
}

/**
 * Tier 2: Check if the user's message is related to Neerzy or local business topics.
 * Returns true if the message contains at least one relevant keyword.
 * Returns false for off-topic queries (weather, sports, math, coding, etc.)
 */
export function isNeerzyRelated(message: string): boolean {
  const normalized = message.toLowerCase().trim();

  // Always allow short messages (greetings, "ok", "yes", etc.)
  if (normalized.length <= 10) return true;

  // Check if any Neerzy keyword is present (using word boundary matching)
  return NEERZY_KEYWORDS.some(keyword => wordBoundaryMatch(normalized, keyword));
}

/**
 * The polite rejection message for off-topic queries.
 */
export const OFF_TOPIC_RESPONSE = `I'm the Neerzy AI assistant — I'm specialized in helping with Neerzy, local business marketing, Google Business Profile, SEO, and review management. 🎯

I can't help with questions outside of these topics, but here's what I CAN help you with:
• 💰 Pricing & plans
• 🚀 How Neerzy works
• ⭐ Getting more Google reviews
• 🌐 SEO & website questions
• 📱 WhatsApp posting workflow

What would you like to know about Neerzy?`;
