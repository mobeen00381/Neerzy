import React from 'react';
import type { Metadata } from 'next';
import { SeoGuideLayout } from '@/components/seo-visuals/SeoGuideLayout';
import { SeoDiagram, AuditResultDiagram, PriorityFlowDiagram, ImprovementTimelineDiagram } from '@/components/seo-visuals/SeoDiagram';
import { CalloutBox } from '@/components/seo-visuals/CalloutBox';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = {
  title: 'How to Improve Your Overall Google Business Profile Audit Score | Neerzy',
  description: 'Got your audit score back? Here\'s how to figure out what to fix first, how long it takes, and which guide to read next based on your lowest category.',
  alternates: { canonical: `https://neerzy.com${ROUTES.IMPROVE_SCORE}` },
  openGraph: {
    title: 'How to Improve Your Overall Audit Score | Neerzy',
    description: 'Got your audit score back? Here\'s how to figure out what to fix first, how long it takes, and which guide to read next.',
    url: `https://neerzy.com${ROUTES.IMPROVE_SCORE}`,
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How to Improve Your Overall Audit Score | Neerzy',
    description: 'Got your audit score back? Here\'s what to fix first and in what order.',
  },
};

export default function ImproveAuditScorePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'What should I fix first after my GBP audit?', acceptedAnswer: { '@type': 'Answer', text: 'Fix Completeness first if it\'s low — it\'s entirely within your direct control and most gaps can be fixed in under 20 minutes. Then Visual Content, Engagement & Activity, Local SEO Optimization, and finally Reviews (which is the slowest-moving but should be started immediately).' } },
      { '@type': 'Question', name: 'How long does it take to improve my audit score?', acceptedAnswer: { '@type': 'Answer', text: 'Completeness and Q&A fixes can register same-day. Visual Content (photos) shows improvement within a week. Reviews & Reputation takes 4–8 weeks of consistent requesting to show meaningful movement.' } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <SeoGuideLayout
        title="How to Improve Your Overall Audit Score"
        description="Got your audit score back? Here's how to figure out what to fix first, how long it takes, and which guide to read next based on your lowest category."
        path={ROUTES.IMPROVE_SCORE}
      >
        <p>You&apos;ve run <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline">Neerzy&apos;s free GBP audit</Link> and you have a number. Now the real question: <strong>what do you actually do next?</strong></p>
        <p>This page is the bridge between your score and a specific plan. It won&apos;t repeat what each category measures — that&apos;s covered in <Link href={ROUTES.UNDERSTANDING_SCORE} className="text-blue-600 hover:underline">Understanding Your Audit Score</Link> and the individual category guides — this page is purely about sequencing: what to fix first, in what order, and what to realistically expect.</p>

        <h2>Step 1: Find Your Lowest-Scoring Category</h2>

        <SeoDiagram caption="Your audit results break down into five categories. Start with the lowest-scoring one that carries the most weight.">
          <AuditResultDiagram />
        </SeoDiagram>

        <p>Your audit results break down into five categories, each with its own score out of 100 and its own weight in your overall total:</p>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th>Category</th><th>Weight</th></tr>
            </thead>
            <tbody>
              <tr><td><Link href={ROUTES.GUIDES.COMPLETENESS} className="text-blue-600 hover:underline">Completeness</Link></td><td><strong>25%</strong></td></tr>
              <tr><td><Link href={ROUTES.GUIDES.REVIEWS} className="text-blue-600 hover:underline">Reviews &amp; Reputation</Link></td><td><strong>25%</strong></td></tr>
              <tr><td><Link href={ROUTES.GUIDES.VISUAL} className="text-blue-600 hover:underline">Visual Content</Link></td><td><strong>20%</strong></td></tr>
              <tr><td><Link href={ROUTES.GUIDES.ENGAGEMENT} className="text-blue-600 hover:underline">Engagement &amp; Activity</Link></td><td><strong>15%</strong></td></tr>
              <tr><td><Link href={ROUTES.GUIDES.LOCAL_SEO} className="text-blue-600 hover:underline">Local SEO Optimization</Link></td><td><strong>15%</strong></td></tr>
            </tbody>
          </table>
        </div>

        <p>Your overall score is the weighted average of these five. The category dragging your score down the most is usually your lowest-scoring category <em>among the two 25%-weighted ones</em> — Completeness or Reviews &amp; Reputation — simply because they carry the most mathematical weight. A 30 in a 15%-weighted category hurts less than a 30 in a 25%-weighted one.</p>

        <h2>Step 2: Fix in the Right Order</h2>

        <SeoDiagram caption="Not all fixes take the same time. Here's the order that produces the fastest visible improvement.">
          <PriorityFlowDiagram />
        </SeoDiagram>

        <p>Not all fixes take the same amount of time or effort. Here&apos;s the realistic order, based on how quickly each category can move:</p>

        <ol>
          <li>
            <strong>Completeness first, if it&apos;s low.</strong> This is entirely within your direct control — no customer behavior required — and most gaps can be fixed in under 20 minutes.{' '}
            <Link href={ROUTES.GUIDES.COMPLETENESS} className="text-blue-600 hover:underline">See the Completeness Score Guide →</Link>
          </li>
          <li>
            <strong>Visual Content second.</strong> Uploading a batch of real job photos takes an afternoon, not weeks, and shows up on your very next audit run.{' '}
            <Link href={ROUTES.GUIDES.VISUAL} className="text-blue-600 hover:underline">See the Visual Content Score Guide →</Link>
          </li>
          <li>
            <strong>Engagement &amp; Activity third.</strong> Publishing your first Google Post and seeding your Q&amp;A section can be done same-day, though the <em>pattern</em> of weekly activity that fully satisfies this category builds over the following month.{' '}
            <Link href={ROUTES.GUIDES.ENGAGEMENT} className="text-blue-600 hover:underline">See the Engagement &amp; Activity Score Guide →</Link>
          </li>
          <li>
            <strong>Local SEO Optimization fourth.</strong> A NAP consistency check across directories and confirming your service areas takes an hour or two of focused work.{' '}
            <Link href={ROUTES.GUIDES.LOCAL_SEO} className="text-blue-600 hover:underline">See the Local SEO Optimization Score Guide →</Link>
          </li>
          <li>
            <strong>Reviews &amp; Reputation — start immediately, but expect it to be the slowest to show full movement.</strong> Unlike the other four, this category depends on real customers acting, not just you updating a field. Start the request habit in Step 1 alongside everything else, but don&apos;t expect it to catch up to your other fixes overnight.{' '}
            <Link href={ROUTES.GUIDES.REVIEWS} className="text-blue-600 hover:underline">See the Reviews Score Guide →</Link>
          </li>
        </ol>

        <CalloutBox type="best-practice" title="Start Reviews on Day One">
          The practical takeaway: <strong>start reviews on day one</strong>, since it&apos;s the slowest-moving category, while knocking out Completeness, Visual Content, Engagement, and Local SEO in the same week.
        </CalloutBox>

        <h2>Step 3: A Realistic Timeline</h2>

        <SeoDiagram caption="A realistic timeline for audit score improvement across all five categories.">
          <ImprovementTimelineDiagram />
        </SeoDiagram>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th>Timeframe</th><th>What Typically Moves</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Same day</strong></td><td>Completeness fixes, seeding Q&amp;A</td></tr>
              <tr><td><strong>Within a week</strong></td><td>Visual Content (photo upload), first Google Post published</td></tr>
              <tr><td><strong>2–4 weeks</strong></td><td>Local SEO Optimization (NAP checks, service areas confirmed), Engagement pattern establishing</td></tr>
              <tr><td><strong>4–8 weeks</strong></td><td>Reviews &amp; Reputation showing meaningful movement</td></tr>
            </tbody>
          </table>
        </div>

        <p>This isn&apos;t a guarantee of specific point increases — your starting score and local market both affect the pace — but it reflects the general order in which categories tend to respond.</p>

        <h2>Step 4: Re-Run the Audit</h2>

        <p>Run the audit again after your first week of fixes to confirm the fast-moving categories (Completeness, Visual Content) have registered, then again at the one-month mark to see Reviews and Engagement catch up. Treat this as a recurring monthly habit rather than a one-time check — profiles drift back toward incomplete and inactive without ongoing maintenance, which is exactly what the <Link href={`${ROUTES.PILLAR}#section-19`} className="text-blue-600 hover:underline">Neerzy WhatsApp workflow</Link> is built to prevent going forward.</p>

        <h2>Which Guide to Read Next</h2>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-semibold text-gray-900 mb-2">Lowest score in…</p>
            <ul className="space-y-2 text-blue-600">
              <li><Link href={ROUTES.GUIDES.COMPLETENESS} className="hover:underline">Completeness → Completeness Score Guide</Link></li>
              <li><Link href={ROUTES.GUIDES.REVIEWS} className="hover:underline">Reviews & Reputation → Reviews Score Guide</Link></li>
              <li><Link href={ROUTES.GUIDES.VISUAL} className="hover:underline">Visual Content → Visual Content Score Guide</Link></li>
              <li><Link href={ROUTES.GUIDES.ENGAGEMENT} className="hover:underline">Engagement & Activity → Engagement Score Guide</Link></li>
              <li><Link href={ROUTES.GUIDES.LOCAL_SEO} className="hover:underline">Local SEO Optimization → Local SEO Score Guide</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-2">Want the full picture?</p>
            <ul className="space-y-2 text-blue-600">
              <li><Link href={ROUTES.UNDERSTANDING_SCORE} className="hover:underline">Understanding Your Audit Score</Link></li>
              <li><Link href={ROUTES.PILLAR} className="hover:underline">SEO for Plumbers: The Complete Guide</Link></li>
            </ul>
          </div>
        </div>

        <CalloutBox type="tip" title="Run or Re-Run Your Free Audit">
          <Link href={ROUTES.AUDIT_TOOL} className="text-blue-600 hover:underline font-semibold">→ Run your free audit at neerzy.com/gmb-audit-tool</Link> if you haven&apos;t yet, or re-run it to track progress.
        </CalloutBox>

      </SeoGuideLayout>
    </>
  );
}
