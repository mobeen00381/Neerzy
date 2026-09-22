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
// src/lib/website.ts ($99 setup, waived inside the early-adopter window;
// $10/month hosting; first 90 days free) and with /pricing (domain $19 once).
// The website builder itself requires a paid Neerzy plan — the Free plan has
// no domain and no website — so "free" is only ever used about the setup fee
// and the first 90 days of hosting, never about the whole product.

export interface WebsiteBuilderFaq {
  question: string;
  answer: string;
}

export const WEBSITE_BUILDER_FAQS: WebsiteBuilderFaq[] = [
  {
    question: "Does my website update automatically when my Google Business Profile changes?",
    answer:
      "Yes. Neerzy keeps your website synced to your connected Google Business Profile, so new photos, updated hours, and new reviews reflect on your site without any manual editing. Every job you post through Neerzy updates the site too. This is the difference from tools that import your profile data once at setup and then rely on you to keep the site current afterwards.",
  },
  {
    question: "Does Google offer a free website builder for Google Business Profiles?",
    answer:
      "No. Google discontinued the basic website builder that used to sit inside Google Business Profile. Businesses that relied on it need a third-party tool to build and host a site from their Business Profile information, which is what Neerzy provides — with an ongoing sync rather than a one-time export.",
  },
  {
    question: "Do I need any design or coding skill to build a website with Neerzy?",
    answer:
      "No. Neerzy builds the website from your connected Google Business Profile in one tap, using a template matched to your trade, with your business name, address, hours, photos and reviews already filled in. There is nothing to design or code — you only edit wording if you want to.",
  },
  {
    question: "Is the website free?",
    answer:
      "The $99 setup fee is waived for early adopters, and your first 90 days of hosting are free. After that, hosting is $10 per month — the same site, the same sync, nothing rebuilt. A custom domain is a one-time $19 fee, and the website builder itself is included with the Pro, Growth, Agency and Unlimited plans (the Free plan covers Google posts and review requests, without a domain or website).",
  },
  {
    question: "Can I use my own domain name?",
    answer:
      "Yes, for a one-time $19 fee. You pick and connect your own domain — such as yourbusinessname.com — during setup, and your website is built on it. You need a domain before the site is built, because the site lives on that address.",
  },
  {
    question: "What happens after the early-adopter offer ends?",
    answer:
      "Nothing is removed or reset. Hosting continues at $10 per month, and you keep the same site, the same sync to your Google Business Profile, and the same domain. The offer only changes the price of getting started: the $99 setup fee is waived for websites created while the early-adopter window is open, and that waiver stays with your site for good.",
  },
  {
    question: "Is this different from generic website builders like Wix or GoDaddy?",
    answer:
      "Yes. Generic builders start you from a blank template and expect you to type in your business details, write your own copy and keep the site updated yourself. Neerzy starts from the Google Business Profile you have already built: the site is generated in one tap from that real data, laid out with a template matched to your trade, and it keeps updating as your profile and your jobs change.",
  },
];
