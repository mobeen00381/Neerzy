// src/lib/gmb-audit-faqs.ts
//
// Single source of truth for the /gmb-audit-tool FAQ content.
//
// Google requires FAQPage structured data to match what is visible on the
// page, so both consumers read this array:
//   • the visible accordion — src/app/gmb-audit-tool/AuditToolClient.tsx
//   • the FAQPage JSON-LD  — src/app/gmb-audit-tool/page.tsx
//
// Edit the wording here and both update together.

export interface AuditFaq {
  question: string;
  answer: string;
}

export const GMB_AUDIT_FAQS: AuditFaq[] = [
  { question: "What is a Google Business Profile audit?", answer: "A GMB audit (Google Business Profile audit) is a comprehensive analysis of your listing that identifies optimization opportunities and issues. It checks your profile completeness, photos, reviews, engagement, and SEO factors to help you rank higher in Google Maps and local search results. Our free audit tool evaluates 5 key areas and provides actionable recommendations." },
  { question: "How much does a GBP audit cost?", answer: "Our free Google score tool is free forever. You can check unlimited businesses at no cost and get detailed scores and recommendations. If you want Neerzy to fix the issues for you, the Free plan is $0/month and paid plans start at $39/month. Your own domain is $19 once, the website build is $99 (free for early adopters), and hosting is $10/month after 90 free days." },
  { question: "How long does a Google Business Profile audit take?", answer: "The audit takes less than 30 seconds from start to finish. Simply search for your business name, select it from the dropdown results, and click 'Run Free Audit Now.' You'll instantly receive your overall score out of 100 plus detailed breakdowns for each category." },
  { question: "What does the audit check exactly?", answer: "Our audit evaluates 5 critical areas: Profile Completeness (25% weight) checks if all your business information is filled out; Visual Content (20%) analyzes your photo count and quality; Reviews & Reputation (25%) examines your rating and review count; Engagement (15%) looks at Google Posts and Q&A activity; and SEO Optimization (15%) checks keyword usage and local SEO factors. Think of it as a focused local SEO audit of your Google Business Profile, scored out of 100 with specific action items." },
  { question: "Can I audit my competitor's Google Business Profile?", // TODO(seo): add contextual link to future competitor-comparison piece here
    answer: "Yes! You can audit any business's Google Business Profile using our free tool. This is great for competitive analysis — see what your competitors are doing well and where they're weak. Use these insights to improve your own GBP and outrank them in local search results." },
  { question: "How often should I audit my Google Business Profile?", answer: "We recommend auditing your GBP at least once per month to track improvements and catch new issues. If you're actively optimizing your profile, audit weekly to measure progress. After making major changes (new photos, posts, or business info), run an audit to see the impact on your score." },
  { question: "Is this a free Google My Business audit tool?", answer: "Yes. Neerzy is a completely free google my business audit tool — no signup, no credit card, and no limit on how many profiles you can scan. Search for your business above, run the audit, and get your score and recommendations in under 30 seconds." }
];
