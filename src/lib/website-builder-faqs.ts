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
// src/lib/website.ts (free build; $10/month hosting after the first 90 free
// days) and /pricing ($19 one-time domain). Building and previewing is free on
// every plan — the custom domain is what unlocks publishing. Live Google sync
// (reviews + photos) runs on paid plans only: a free-plan site is built from
// real data but never auto-updates.

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
    // Phrased to answer the two highest-volume free-intent queries verbatim
    // ("free google business website", 5,000/mo, +900% YoY) and the
    // transition-intent cluster ("gmb to website free") that planners can't
    // size but that converts hardest.
    question: "Is building a website from my Google Business Profile free?",
    answer:
      "Yes. Turning your Google Business Profile (GMB) into a website is free to build and preview — no setup fee — and your free Google Business website includes the first 90 days of hosting free. After that, hosting is $10 per month. To publish it on your own domain you register that domain through Neerzy for $19, once, in your name.",
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
      "Hosting is $10 per month after the first 90 free days. If you don't continue, your site goes offline — but nothing is deleted. You can bring it back exactly as it was within 30 days by reactivating hosting.",
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
