import React from 'react';
import type { Metadata } from 'next';
import { SeoGuideLayout } from '@/components/seo-visuals/SeoGuideLayout';
import { Screenshot } from '@/components/seo-visuals/Screenshot';
import { CalloutBox } from '@/components/seo-visuals/CalloutBox';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'How to Improve Your Google Business Profile Completeness Score | Neerzy',
  description: 'Completeness makes up 25% of your Google Business Profile audit score — and it\'s the fastest category to fix. Here\'s exactly what\'s checked and how to raise it today.',
  alternates: { canonical: `https://neerzy.com${ROUTES.GUIDES.COMPLETENESS}` },
  openGraph: {
    title: 'Completeness Score Guide | Neerzy',
    description: 'Completeness is 25% of your GBP audit score and the fastest category to fix. Here\'s exactly what\'s checked.',
    url: `https://neerzy.com${ROUTES.GUIDES.COMPLETENESS}`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Completeness Score Guide | Neerzy',
    description: 'Completeness is 25% of your GBP audit score and the fastest category to fix.',
  },
};

export default function CompletenessScoreGuidePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'Can I leave the business description blank?', acceptedAnswer: { '@type': 'Answer', text: 'You can, but it counts as an incomplete field — even a short, factual paragraph naming your services and city scores better than leaving it empty.' } },
      { '@type': 'Question', name: 'Can I add multiple categories to my Google Business Profile?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — one primary category and multiple accurate secondary categories. Only add categories that genuinely describe your services to avoid violating Google\'s guidelines.' } },
      { '@type': 'Question', name: 'What if I work from home and don\'t want my address public?', acceptedAnswer: { '@type': 'Answer', text: 'Google allows service-area businesses to hide their exact address while still listing service areas — this doesn\'t count against your Completeness score as long as the service-area fields themselves are filled in.' } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <SeoGuideLayout
        title="How to Improve Your Completeness Score"
        description="Completeness makes up 25% of your Google Business Profile audit score — and it's the fastest category to fix. Here's exactly what's checked and how to raise it today."
        path={ROUTES.GUIDES.COMPLETENESS}
      >
        <p>Completeness is one of two categories weighted at 25% in <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">Neerzy&apos;s free GBP audit</Link> — tied with Reviews &amp; Reputation for the most influence on your overall score. The difference is that Completeness is almost entirely within your direct control and can be fixed in a single sitting, which makes it the best place to start if you&apos;re looking for the fastest visible improvement after your first audit.</p>

        <h2>1. What This Score Measures</h2>

        <Screenshot
          src=""
          alt="Screenshot of the Neerzy audit Completeness section showing checked and unchecked fields: business name, address, phone, website, hours, primary category, description, and attributes."
          caption="The Completeness category checks each of these core profile fields as present or missing."
        />

        <p>The audit checks whether these fields are actually filled in on your Google Business Profile:</p>
        <ul>
          <li>Business name present</li>
          <li>Address present</li>
          <li>Phone number present</li>
          <li>Website link</li>
          <li>Business hours set</li>
          <li>Primary category set</li>
          <li>Business description written (up to ~750 characters)</li>
          <li>Attributes and services offered</li>
        </ul>
        <p>Each of these is checked as present or missing — there&apos;s no partial credit for a vague or half-filled field, which is why profiles that look &quot;mostly done&quot; from a glance often score lower than expected here.</p>

        <h2>2. Why Google Cares</h2>

        <CalloutBox type="important" title="Why Completeness Matters to Google">
          Google&apos;s local ranking algorithm relies on your profile to determine relevance — whether your business is actually a match for a given search. A missing category, an empty description, or unset business hours doesn&apos;t just look unfinished to a human visitor; it removes a direct signal Google uses to decide whether to show your business at all. An incomplete profile isn&apos;t a smaller version of a complete one in Google&apos;s eyes — it&apos;s a weaker relevance match, full stop.
        </CalloutBox>

        <h2>3. Common Reasons for a Low Score</h2>

        <ul>
          <li><strong>The profile was claimed years ago and never revisited.</strong> Many plumbing businesses set up their listing once, filled in the bare minimum, and never returned.</li>
          <li><strong>The business description field was left blank,</strong> or contains just a single generic sentence far short of the full character allowance.</li>
          <li><strong>Only a primary category is set,</strong> with no secondary categories added even though the business genuinely offers multiple service types.</li>
          <li><strong>Attributes were never touched</strong> — free estimates, licensed, veteran-owned, and similar tags exist but were never checked because the owner didn&apos;t know the section existed.</li>
          <li><strong>Business hours are set but not maintained</strong> — accurate when created, now outdated after a schedule change.</li>
        </ul>

        <h2>4. Real Examples</h2>

        <Screenshot
          src=""
          alt="Side-by-side comparison of two Google Business Profiles: one with minimal fields filled scoring in the 40-60 range, another with full description, categories, and attributes scoring 85-100."
          caption="The difference between a profile filled in years ago and one maintained today."
        />

        <p>A plumbing company with a name, address, and phone number filled in, but no business description, no secondary categories, and no listed attributes, will typically score in the 40–60 range on this category alone — a large gap for something that takes under 20 minutes to fix.</p>
        <p>A business that has gone further — full description, multiple accurate categories, every applicable attribute checked, and current hours including holiday schedules — will typically score in the 85–100 range, with the only remaining gaps being genuinely minor.</p>

        <h2>5. Priority Checklist</h2>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-6">
          <p className="font-semibold text-gray-900 mb-4">Work through these in order — each is a direct field in Google Business Profile Manager:</p>
          <ul className="space-y-3 text-gray-700">
            {[
              'Confirm name, address, and phone number are accurate and exactly match your website',
              'Set your primary category to "Plumber" (not a generic "Contractor")',
              'Add every accurate secondary category (e.g., "Drainage service," "Water heater repair service")',
              'Write the full business description using close to the full ~750-character allowance',
              'List every individual service you offer, not just a general summary',
              'Check every applicable attribute',
              'Confirm business hours are current, including upcoming holiday hours',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-1 w-5 h-5 border-2 border-gray-400 rounded flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <h2>How This Fits Your Overall Audit Score</h2>

        <p>Completeness is one of two categories weighted at 25% — the other being Reviews &amp; Reputation. Together, these two categories make up half of your overall score, which is why a low overall score is often traceable to a gap in one or both of them rather than the three lower-weighted categories. Fixing Completeness fully, on its own, can move your overall score meaningfully even before touching anything else.</p>

        <h2>Common Questions</h2>

        <p><strong>Can I leave the description blank if I don&apos;t know what to write?</strong><br/>You can, but it counts as an incomplete field — even a short, factual paragraph naming your services and city scores better than leaving it empty.</p>
        <p><strong>Does Google require a business description?</strong><br/>No, it&apos;s optional at the platform level, but the audit treats a filled-in description as part of a complete profile, since it&apos;s a real relevance signal Google&apos;s own algorithm uses.</p>
        <p><strong>Can I add multiple categories?</strong><br/>Yes — one primary category and multiple accurate secondary categories. Adding categories that don&apos;t genuinely describe your services can violate Google&apos;s guidelines, so only add ones that are true.</p>
        <p><strong>What if I work from home and don&apos;t want my address public?</strong><br/>Google allows service-area businesses to hide their exact address while still listing service areas — this doesn&apos;t count against your Completeness score as long as the service-area fields themselves are filled in.</p>
        <p><strong>How many services should I list?</strong><br/>List every service you actually offer, individually, rather than one general summary — each specific service listed is a separate relevance signal.</p>
        <p><strong>Can I change my categories later without losing progress?</strong><br/>Yes, categories can be edited anytime with no penalty for changing them, as long as the updated categories remain accurate.</p>

        <h2>6. Common Mistakes</h2>

        <CalloutBox type="warning" title="Keyword-Stuffing Your Business Name">
          Adding &quot;24/7 Emergency Plumber&quot; to a name that isn&apos;t your legal business name violates Google&apos;s guidelines and risks suspension — a genuinely severe consequence for a minor perceived gain.
        </CalloutBox>
        <ul>
          <li><strong>Choosing an overly broad category</strong> (&quot;Contractor&quot; instead of &quot;Plumber&quot;) to try to appear in more searches — this typically dilutes relevance rather than expanding it.</li>
          <li><strong>Writing a description full of generic marketing language</strong> (&quot;best plumber in town!&quot;) instead of specific, factual detail about services and service area — specificity is what actually supports relevance matching.</li>
        </ul>

        <h2>7. When to Re-Run the Audit</h2>

        <p>Completeness is the fastest-moving category in the entire audit. Since every fix here is a direct field update with no dependency on customer behavior (unlike reviews, which require real people to act), you can typically re-run the audit the same day and see the score move immediately.</p>

        <h2>8. Related Guides</h2>

        <ul>
          <li><Link href={ROUTES.UNDERSTANDING_SCORE} className="text-blue-600 hover:underline">Understanding Your Audit Score</Link> — how all five categories fit together</li>
          <li><Link href={ROUTES.GUIDES.REVIEWS} className="text-blue-600 hover:underline">Reviews Score Guide</Link> — the other 25%-weighted category</li>
          <li><Link href={`${ROUTES.PILLAR}#section-5`} className="text-blue-600 hover:underline">Section 5 of the full plumbing SEO guide</Link> — the complete field-by-field GBP optimization walkthrough</li>
        </ul>

        <h2>9. What Improvement Should You Expect?</h2>

        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Action</th><th>Likely Impact</th></tr></thead>
            <tbody>
              <tr><td>Fill in a missing description, categories, or attributes</td><td><strong>Immediate</strong> — visible on your next audit run</td></tr>
              <tr><td>Add every individual service you offer</td><td><strong>Quick</strong></td></tr>
              <tr><td>Keep hours current, including holidays</td><td><strong>Ongoing</strong> — prevents future score drops, not a one-time fix</td></tr>
            </tbody>
          </table>
        </div>

        <CalloutBox type="tip" title="Run or Re-Run Your Free Audit">
          Most Completeness fixes take under 20 minutes and show up the same day. <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline font-semibold">→ Run or re-run your free audit at neerzy.com/gmb-audit-tool</Link>
        </CalloutBox>

      </SeoGuideLayout>
    </>
  );
}
