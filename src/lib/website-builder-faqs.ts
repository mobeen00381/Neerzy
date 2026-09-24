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
  {
    question: "Is the website free?",
    answer:
      "Building and previewing your website is free, with no setup fee. To publish it, you register your own domain for $19, once. Your first 90 days of hosting are then free — after that, hosting is $10 per month to keep the site online.",
  },
  {
    question: "Does my website update automatically when my Google Business Profile changes?",
    answer:
      "Yes, on any paid plan. Live sync keeps your site updated with new job photos, hours and reviews automatically. On the free start, your site is still built from your real Google Business Profile data — it just stays exactly as built until you're on a paid plan, so no Google API calls are spent on non-paying accounts.",
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
