// src/lib/website-builder-faqs.ts
//
// Single source of truth for the /website-builder FAQ content.
//
// Google requires FAQPage structured data to match what is visible on the
// page, so both consumers read this array:
//   • the visible accordion — src/app/website-builder/page.tsx
//   • the FAQPage JSON-LD  — src/app/website-builder/page.tsx
//
// Same pattern as GMB_AUDIT_FAQS (src/lib/gmb-audit-faqs.ts). Edit the wording
// here and both update together.
//
// PRICING NOTE: every money figure below must stay in step with
// src/lib/website.ts (free preview; $10/month hosting after the first 90 free
// days) and /pricing ($19 one-time domain). The free, no-account step is the
// on-page preview — a mock built from the visitor's Google listing. Building
// and publishing the real site needs a free account AND the customer's own
// domain: $19 once for standard names, registered in their name (premium names
// cost more, price shown before purchase). Live Google sync (reviews + photos)
// runs on paid plans only: a free-plan site is built from real data but never
// auto-updates.

export interface WebsiteBuilderFaq {
  question: string;
  answer: string;
}

export const WEBSITE_BUILDER_FAQS: WebsiteBuilderFaq[] = [
  // The first four are the AEO priority set — the plain-language phrasings owners
  // (and AI answer engines) actually type. They lead the array so the accordion
  // opens on the highest-intent question.
  {
    question: "How does Neerzy build a website from a Google Business Profile?",
    answer:
      "Neerzy connects directly to your Google Business Profile, pulling your business name, address, hours, photos and customer reviews into a pre-designed trade template in under 60 seconds.",
  },
  {
    // Phrased to answer the highest-volume free-intent queries
    // ("free google business website", 5,000/mo, +900% YoY) and the
    // transition-intent cluster ("gmb to website free") — but as the PREVIEW
    // question, because the preview (no account) is the only free step. The
    // real build needs a free account and the customer's own domain first; see
    // src/lib/automation/offer-facts.ts for the verified wording.
    question: "Can I preview a website from my Google Business Profile for free?",
    answer:
      "Yes. The preview is free and needs no account: search your business name and Neerzy shows the website it would build from your Google Business Profile — your reviews, photos, hours and services already in — as often as you like. Building and publishing the real site needs a free Neerzy account and your own domain: $19 once for a standard name, registered in your name (premium names cost more, with the price shown before purchase). Hosting is free for the first 90 days after your site is built, then $10 per month.",
  },
  {
    question: "Does the website update when I get new Google reviews or photos?",
    answer:
      "Yes, on an active paid plan. Live sync keeps your site updated with new job photos, hours and reviews automatically. On the free start, your site is still built from your real Google Business Profile data — it just stays exactly as built until you're on a paid plan, so no Google API calls are spent on non-paying accounts.",
  },
  {
    question: "What happens after my first 30 days?",
    answer:
      "Posting and review requests pause. Your account, your Google Score audit and your website all stay as they are — your site keeps loading, showing your last update, and nothing is deleted. Pick a paid plan any time to turn posting and live sync back on.",
  },
  {
    question: "What happens after 90 days of hosting?",
    answer:
      "Hosting is $10 per month after the first 90 free days, counted from the day your site is built. If you don't continue, your site goes offline — but nothing is deleted. You can bring it back exactly as it was within 30 days by reactivating hosting.",
  },
  {
    question: "Is Neerzy a replacement for Google's discontinued business.site websites?",
    answer:
      "Yes. Following the discontinuation of Google Business Profile websites in March 2024, Neerzy serves as an automated alternative: it publishes your site on your own custom domain and, on a paid plan, keeps the content synced with your profile continuously.",
  },
  {
    question: "Does Google offer a free website builder for Google Business Profiles?",
    answer:
      "No. Google discontinued the basic website builder that used to sit inside Google Business Profile in March 2024. Businesses that relied on it were sent back to their plain Business Profile, with no way to edit the old site. Neerzy is a third-party alternative built from the same profile data — with live sync on paid plans.",
  },
  {
    question: "Do I need any design or coding skill to build a website with Neerzy?",
    answer:
      "No. Your site is generated from your connected Google Business Profile, in a template matched to your trade, with your business name, address, hours, photos and reviews already filled in. There is nothing to design or code — you only edit wording if you want to.",
  },
  {
    question: "Can I use my own domain name?",
    answer:
      "Right now you register a new domain through Neerzy for $19, once — it's yours, registered in your name. Connecting a domain you already own isn't available yet.",
  },
  {
    question: "Is this different from generic website builders like Wix or GoDaddy?",
    answer:
      "Yes. Generic builders start from a blank template and expect you to write your own copy and keep the site updated yourself. Neerzy starts from the Google Business Profile you have already built, in a template matched to your trade — and, on a paid plan, keeps it updated as your profile and your jobs change.",
  },
];
