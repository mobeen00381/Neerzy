import React from 'react';
import type { Metadata } from 'next';
import { SeoGuideLayout } from '@/components/seo-visuals/SeoGuideLayout';
import { Screenshot } from '@/components/seo-visuals/Screenshot';
import { CalloutBox } from '@/components/seo-visuals/CalloutBox';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'How to Improve Your Google Reviews Score: A Complete Guide for Plumbers | Neerzy',
  description: 'Reviews & Reputation make up 25% of your Google Business Profile audit score. Here\'s exactly how it\'s calculated and how to raise it — with templates, timing, and common mistakes.',
  alternates: { canonical: `https://neerzy.com${ROUTES.GUIDES.REVIEWS}` },
  openGraph: {
    title: 'Reviews Score Guide | Neerzy',
    description: 'Reviews & Reputation is 25% of your GBP audit score. Here\'s how to raise it with timing, templates, and what to avoid.',
    url: `https://neerzy.com${ROUTES.GUIDES.REVIEWS}`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reviews Score Guide | Neerzy',
    description: 'Reviews & Reputation is 25% of your GBP audit score. Templates, timing, and common mistakes explained.',
  },
};

export default function ReviewsScoreGuidePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'What if someone leaves a one-star review?', acceptedAnswer: { '@type': 'Answer', text: 'Respond professionally and briefly, without getting defensive, and take further detail offline. A single low review, especially one you\'ve responded to well, rarely has an outsized effect on a category built around ongoing patterns.' } },
      { '@type': 'Question', name: 'Can I buy reviews to rank faster?', acceptedAnswer: { '@type': 'Answer', text: 'No — purchased reviews violate Google\'s terms, are increasingly detected and removed in bulk (sometimes taking legitimate reviews with them), and can result in profile suspension.' } },
      { '@type': 'Question', name: 'How many reviews does a plumber need to rank well?', acceptedAnswer: { '@type': 'Answer', text: 'There\'s no fixed number, but competitive local markets typically require 50+ recent reviews to remain consistently competitive — with steady, ongoing volume mattering more than any single total.' } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <SeoGuideLayout
        title="How to Improve Your Reviews & Reputation Score"
        description="Reviews & Reputation make up 25% of your Google Business Profile audit score. Here's exactly how it's calculated and how to raise it — with templates, timing, and common mistakes."
        path={ROUTES.GUIDES.REVIEWS}
      >
        <p>Reviews &amp; Reputation is the highest-weighted category in <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">Neerzy&apos;s free GBP audit</Link> — 25% of your total score, tied with Completeness. If your overall audit score came back lower than you&apos;d like and Reviews &amp; Reputation was the weak category, this page is the deep dive on fixing exactly that.</p>

        <h2>What This Score Actually Measures</h2>

        <Screenshot
          src=""
          alt="Screenshot of the Neerzy audit Reviews & Reputation section showing total review count, average star rating, review velocity indicator, and response rate percentage."
          caption="The Reviews & Reputation category measures four distinct signals — not just your star rating."
        />

        <p>The audit checks four things under this category:</p>
        <ul>
          <li><strong>Total review count</strong> — how many reviews you&apos;ve accumulated</li>
          <li><strong>Average rating</strong> — your overall star rating</li>
          <li><strong>Review velocity</strong> — how many new reviews you&apos;ve received recently, not just historically</li>
          <li><strong>Response rate and time</strong> — whether, and how quickly, you respond to reviews</li>
        </ul>
        <p>It&apos;s worth noticing what&apos;s <em>not</em> in that list: the audit doesn&apos;t score review length, doesn&apos;t require a specific star rating floor to pass, and doesn&apos;t penalize a single negative review. It&apos;s measuring an ongoing pattern of activity and trust, not a perfect record.</p>

        <h2>Why Velocity Matters More Than Most Plumbers Think</h2>

        <CalloutBox type="important" title="Recency Beats Volume">
          Two plumbing businesses can have the identical total review count and average rating and still score very differently here, because of one factor: recency. A business with 80 reviews, all from three years ago, reads to Google very differently than a business with 80 reviews and five new ones in the last month. Google is trying to answer &quot;is this business still good, right now&quot; — and a stale review pile, however positive, answers a slightly different question than the one being asked.
        </CalloutBox>

        <p>This is why the single highest-leverage fix for a low Reviews &amp; Reputation score usually isn&apos;t chasing a higher star rating — it&apos;s re-establishing a steady monthly flow of new reviews, even a modest one.</p>

        <h2>How Many New Reviews Per Month Is &quot;Enough&quot;?</h2>

        <p>There&apos;s no universal number, since it depends on your local market&apos;s competitiveness, but a reasonable target for most small plumbing businesses is <strong>4–8 new reviews per month</strong> — roughly one for every few completed jobs. Businesses in dense, competitive metro markets should aim higher; businesses in smaller towns with less local competition can often maintain a strong score with fewer.</p>

        <h2>The Request: Timing, Wording, and Common Mistakes</h2>

        <Screenshot
          src=""
          alt="Timeline showing review request response rates peaking at immediate post-job and dropping sharply after 24-48 hours."
          caption="Ask immediately after the job — satisfaction peaks the moment the problem is solved."
        />

        <p><strong>Timing.</strong> Ask immediately after the job is completed — not the next day, not &quot;when things settle down.&quot; Satisfaction peaks the moment the problem is solved and fades measurably within 24–48 hours.</p>
        <p><strong>Wording.</strong> Short and specific beats long and polished:</p>
        <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-700 my-4">
          &quot;Hi [Name], thanks for choosing [Business]. Would you mind leaving a quick review?&quot;
        </blockquote>
        <p>Paired with a direct, one-tap link to your Google review page. Longer, more formal requests consistently see lower click-through — the extra words are friction, not persuasion.</p>

        <p><strong>Common mistakes that suppress response rate:</strong></p>
        <ul>
          <li>Asking too many days after the job, when the memory has faded</li>
          <li>Burying the review link behind a &quot;click here&quot; instead of a direct one-tap URL</li>
          <li>Sending the exact same generic message to every customer, with no name or technician reference</li>
          <li>Offering a discount or incentive in exchange for a review — this violates Google&apos;s policies and puts your entire profile at risk if flagged</li>
        </ul>

        <h2>Responding to Reviews (Both Directions)</h2>

        <p>Response rate and time are scored directly, which means responding is not optional politeness — it&apos;s a measured input.</p>
        <p><strong>For positive reviews:</strong> a brief, genuine thank-you that references something specific from the review reads as authentic and takes under a minute.</p>
        <p><strong>For negative reviews:</strong> acknowledge the issue without getting defensive, briefly state what you did or will do about it, and take further detail offline. Future customers reading the exchange are judging your response to the problem far more than the problem itself — a thoughtful reply to criticism often builds more trust than it costs.</p>

        <h2>What a Strong Reviews &amp; Reputation Score Looks Like in Practice</h2>

        <p>As a rough benchmark: businesses scoring well in this category typically maintain 50+ total reviews, a rating at or above 4.5 stars, at least a handful of new reviews every month, and a response rate close to 100% within 48 hours. None of these individually guarantees a top score, but together they represent the pattern the category is built to detect.</p>

        <h2>Fix This, Then Re-Check</h2>

        <Screenshot
          src=""
          alt="Progress graph showing the Reviews & Reputation score climbing over a 4-week period after implementing consistent review requests."
          caption="A realistic 4-week improvement arc for Reviews & Reputation — gradual but compounding."
        />

        <p>Review-based improvements move more slowly than photo or post-based ones, since they depend on real customers actually leaving reviews over time — expect to see measurable score movement over 4–8 weeks of consistent requesting, not overnight.</p>

        <p><strong>A realistic four-week starting sequence:</strong></p>
        <ul>
          <li><strong>Week 1:</strong> Respond to every existing unanswered review, positive and negative.</li>
          <li><strong>Week 2:</strong> Start sending a review request after every completed job, using the short template above.</li>
          <li><strong>Week 3:</strong> Keep the requests going — this is the week most businesses quietly stop, which is exactly why it matters most.</li>
          <li><strong>Week 4:</strong> Re-run the audit and compare against your starting score.</li>
        </ul>

        <h2>Common Questions</h2>

        <p><strong>What if someone leaves a one-star review?</strong><br/>Respond professionally and briefly, without getting defensive, and take further detail offline — see the response guidance above. A single low review, especially one you&apos;ve responded to well, rarely has an outsized effect on a category built around ongoing patterns.</p>
        <p><strong>Should I try to get a fake review removed, or ask friends to leave reviews?</strong><br/>You can flag genuinely fake or policy-violating reviews for Google to review. Asking friends or family who aren&apos;t real customers to leave reviews violates Google&apos;s policies and risks your entire profile — it&apos;s not worth the risk for a small, short-term bump.</p>
        <p><strong>Can I buy reviews?</strong><br/>No — purchased reviews violate Google&apos;s terms, are increasingly detected and removed in bulk (sometimes taking legitimate reviews with them), and can result in profile suspension.</p>
        <p><strong>Should my employees leave reviews for the business?</strong><br/>No — reviews from employees, even well-intentioned ones, violate Google&apos;s conflict-of-interest policies and can be removed if identified.</p>
        <p><strong>How many reviews are actually enough?</strong><br/>There&apos;s no fixed finish line — competitive markets generally need more to stay visible, but the more useful target is an ongoing monthly flow rather than a one-time total to hit and stop at.</p>

        <p>For the timing and template guidance in more depth, see <Link href={`${ROUTES.PILLAR}#section-13`} className="text-blue-600 hover:underline">Section 13 of the full plumbing SEO guide</Link>. For how this fits alongside your other four category scores, see <Link href={ROUTES.UNDERSTANDING_SCORE} className="text-blue-600 hover:underline">Understanding Your Audit Score</Link>.</p>

        <h2>What Improvement Should You Expect?</h2>

        <div className="overflow-x-auto">
          <table>
            <thead><tr><th>Action</th><th>Likely Impact</th></tr></thead>
            <tbody>
              <tr><td>Respond to all existing unanswered reviews</td><td><strong>Quick</strong> — visible within days</td></tr>
              <tr><td>Add 4–8 new reviews this month</td><td><strong>Medium</strong> — visible within a few weeks</td></tr>
              <tr><td>Maintain monthly review requests as a habit</td><td><strong>Long-term</strong> — compounds over months</td></tr>
            </tbody>
          </table>
        </div>
        <p>These aren&apos;t guaranteed point increases — your actual score depends on your starting point and your local market. But the order above reflects which actions move the fastest versus which ones build durable, lasting improvement.</p>

        <CalloutBox type="tip" title="Re-Run Your Audit After a Month">
          <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline font-semibold">→ Re-run your free audit</Link> after a month of consistent review requests to see the movement.
        </CalloutBox>

      </SeoGuideLayout>
    </>
  );
}
