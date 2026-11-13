'use client';

import { useState, useEffect, Suspense, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  FileText,
  HelpCircle,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Star,
  Swords,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import AuditReviewPrompt from '@/components/reviews/AuditReviewPrompt';
import { trackEvent } from '@/lib/analytics';
import {
  MARKETING_CONSENT_DETAIL,
  MARKETING_CONSENT_HEADLINE,
  PRIVACY_POLICY_PATH,
} from '@/lib/consent';
import {
  monthlyCallsFromEnquiries,
  type AuditFinding,
  type AuditReport,
  type AuditSection,
  type AuditSectionKey,
} from '@/lib/audit-engine';

/** The API returns exactly this: a photo URL, the engine's report, and whether the fix list came with it. */
type AuditPayload = { photoUrl?: string; report?: AuditReport; locked?: boolean };

const SECTION_META: Record<AuditSectionKey, { label: string; weight: string; blurb: string }> = {
  local_seo: {
    label: 'Local SEO',
    weight: '50% of total',
    blurb: 'Can Google show you, trust you and rank you in the map pack?',
  },
  aeo: {
    label: 'AEO',
    weight: '25% of total',
    blurb: 'Answer engines: can Siri, Alexa or ChatGPT answer "who should I call?" from your site?',
  },
  geo: {
    label: 'GEO',
    weight: '25% of total',
    blurb: 'Generative engines: can AI crawlers read your site, and is your business in structured data?',
  },
};

export default function AuditResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)]">
          <Loader2 className="w-16 h-16 text-[#25D366] animate-spin mb-4" />
          <div className="text-xl font-bold text-[#0F5C4D] animate-pulse">Loading your audit...</div>
        </div>
      }
    >
      <AuditContent />
    </Suspense>
  );
}

function AuditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeId = searchParams.get('placeId');
  const businessName = searchParams.get('name');
  const urlUnlock = searchParams.get('t') || '';

  const [payload, setPayload] = useState<AuditPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingPhase, setLoadingPhase] = useState(0);
  // Bumped once a report has been sent: the token is then in hand, so this same
  // page re-asks the API instead of reloading (no spinner, no lost scroll).
  const [refreshKey, setRefreshKey] = useState(0);

  const phases = [
    'Reading your Google Business Profile...',
    'Checking your site for AI crawler access...',
    'Looking for structured data machines can quote...',
    'Comparing you against the listings Google returns for your trade...',
    'Ordering the fixes by what costs you the most calls...',
  ];

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingPhase((prev) => (prev + 1) % phases.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!placeId) {
      router.push('/gmb-audit-tool');
      return;
    }

    // Where the unlock token lives: the emailed/WhatsApp link (?t=) wins, then
    // whatever this device already proved - so a reload stays unlocked even
    // though no token is sitting in the address bar to copy and share.
    const lockKey = `neerzy:report-unlock:${placeId}`;
    const readUnlock = () => {
      try {
        if (urlUnlock) {
          window.localStorage.setItem(lockKey, urlUnlock);
          return urlUnlock;
        }
        return window.localStorage.getItem(lockKey) || '';
      } catch {
        return urlUnlock;
      }
    };

    let cancelled = false;

    const runAudit = async () => {
      try {
        const res = await fetch('/api/audit/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            placeId,
            businessName: businessName || 'Business',
            unlock: readUnlock(),
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Audit failed');
        if (!data?.report) throw new Error('Audit returned no report');

        if (!cancelled) setPayload(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to generate your audit. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    runAudit();
    return () => {
      cancelled = true;
    };
  }, [placeId, businessName, router, urlUnlock, refreshKey]);

  /**
   * Called by the delivery card once a report has been sent. Nothing is unlocked
   * here - the token is stored and the audit is re-requested, so the server is
   * the one deciding that this visitor now gets the full report.
   */
  const handleUnlocked = (token: string) => {
    if (placeId && token) {
      try {
        window.localStorage.setItem(`neerzy:report-unlock:${placeId}`, token);
      } catch {
        // Private mode: the token still works for this visit, it just won't outlive it.
      }
    }
    setRefreshKey((key) => key + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-emerald-100 border-t-[#25D366] rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-[#0F5C4D] animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-[#0F5C4D] mb-3">
          Checking {businessName || 'your business'}...
        </h2>
        <div className="bg-white px-6 py-3 rounded-full border border-emerald-100 shadow-sm max-w-md">
          <p className="text-[#4F635F] font-semibold text-sm animate-pulse">{phases[loadingPhase]}</p>
        </div>
        <p className="text-slate-400 font-bold text-xs mt-6 uppercase tracking-wider">
          Live Google data plus your own website — no guesswork
        </p>
      </div>
    );
  }

  if (error || !payload?.report) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-3xl shadow-2xl max-w-md border border-red-50">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Audit Failed</h2>
          <p className="text-slate-500 font-semibold mb-6">{error || 'No report returned.'}</p>
          <button
            onClick={() => router.push('/gmb-audit-tool')}
            className="w-full bg-[#0F5C4D] hover:bg-[#073a30] text-white py-4 rounded-xl font-bold transition-all shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuditReportView
      report={payload.report}
      photoUrl={payload.photoUrl || ''}
      placeId={placeId}
      businessName={businessName}
      locked={payload.locked === true}
      onUnlocked={handleUnlocked}
    />
  );
}

// ─── Presentation helpers ────────────────────────────────────────────────────

function toneFor(value: number) {
  if (value >= 80)
    return { ring: '#22C55E', text: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  if (value >= 50)
    return { ring: '#F59E0B', text: 'text-amber-600', chip: 'bg-amber-50 text-amber-700 border-amber-100' };
  return { ring: '#F43F5E', text: 'text-rose-600', chip: 'bg-rose-50 text-rose-700 border-rose-100' };
}

/** A 0-100 dial. Renders "—" instead of a zero when nothing was measurable. */
function ScoreRing({
  value,
  measurable = true,
  size = 132,
  stroke = 12,
  label,
}: {
  value: number;
  measurable?: boolean;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = measurable ? Math.max(0, Math.min(100, value)) : 0;
  const tone = toneFor(measurable ? value : 0);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      {measurable && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-1000"
        />
      )}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.3}
        fontWeight="800"
        fill={measurable ? '#0F172A' : '#94A3B8'}
      >
        {measurable ? Math.round(value) : '—'}
      </text>
    </svg>
  );
}

function AuditReportView({
  report,
  photoUrl,
  placeId,
  businessName,
  locked,
  onUnlocked,
}: {
  report: AuditReport;
  photoUrl: string;
  placeId: string | null;
  businessName: string | null;
  /** True when the API withheld the fix list, the head-to-head and the evidence. */
  locked: boolean;
  onUnlocked: (token: string) => void;
}) {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState('');
  const monthly = monthlyCallsFromEnquiries(report.opportunity, Number(enquiries));
  const tier = toneFor(report.scores.overall);
  // Counted from the findings still in the payload, so the teaser can say how
  // much it is holding back without showing any of it.
  const sectionKeys = Object.keys(SECTION_META) as AuditSectionKey[];
  const checkedCount = sectionKeys.reduce(
    (total, key) => total + report.sections[key].findings.length,
    0
  );
  const failedCount = sectionKeys.reduce(
    (total, key) =>
      total + report.sections[key].findings.filter((finding) => finding.status === 'fail').length,
    0
  );
  const generated = new Date(report.generatedAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F0F7F5_0%,#ffffff_100%)] py-10 md:py-16 px-4 md:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        <button
          onClick={() => router.push('/gmb-audit-tool')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-[#0F5C4D] transition-all font-bold text-sm bg-white/80 border border-slate-100 px-4 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Search</span>
        </button>

        {/* Header: who we looked at, and the one number that summarises it */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={businessName || report.businessName || 'Business'}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-emerald-100 shadow"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-emerald-50 border-4 border-emerald-100 shadow flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-[#0F5C4D]" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                {report.trade.label} · audited {generated}
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-[#0F5C4D] leading-tight truncate">
                {businessName || report.businessName || 'Your business'}
              </h1>
              <span
                className={`inline-block mt-2 text-xs font-black px-3 py-1 rounded-full border ${tier.chip}`}
              >
                {report.tier.label} · {report.scores.overall}/100
              </span>
              <p className="text-slate-600 font-semibold text-sm mt-3 max-w-2xl">{report.tier.summary}</p>
            </div>

            <div className="shrink-0 flex flex-col items-center">
              <ScoreRing value={report.scores.overall} label="Overall score" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 mt-1">
                Overall
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7 pt-6 border-t border-slate-100">
            <Fact icon={<Star className="w-4 h-4 text-amber-500" />} value={
              report.facts.rating > 0 ? report.facts.rating.toFixed(1) : '—'
            } label="Rating" />
            <Fact icon={<MessageSquare className="w-4 h-4 text-[#25D366]" />} value={String(report.facts.reviewCount)} label="Reviews" />
            <Fact icon={<Camera className="w-4 h-4 text-sky-500" />} value={String(report.facts.photoCount)} label="Photos (API cap 10)" />
            <Fact
              icon={<TrendingUp className="w-4 h-4 text-[#0F5C4D]" />}
              value={report.facts.hasRecentReview ? 'Yes' : 'No'}
              label={report.facts.newestReview ? `Review since ${report.facts.newestReview}` : 'Review in 12 months'}
            />
          </div>
        </section>

        {/* The three surfaces a trade business actually competes on */}
        <section className="grid gap-4 md:grid-cols-3">
          {(Object.keys(SECTION_META) as AuditSectionKey[]).map((key) => {
            const section = report.sections[key];
            const meta = SECTION_META[key];
            const tone = toneFor(section.score);
            const gaps = section.findings.filter((finding) => finding.status === 'fail').length;

            return (
              <div
                key={key}
                className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-extrabold text-slate-800 text-lg leading-tight">{meta.label}</h2>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                    {meta.weight}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="shrink-0">
                    <ScoreRing
                      value={section.score}
                      measurable={section.measurable}
                      size={88}
                      stroke={9}
                      label={`${meta.label} score`}
                    />
                  </div>
                  <p className="text-xs font-semibold text-slate-500 leading-snug">{meta.blurb}</p>
                </div>
                <p
                  className={`mt-auto pt-4 text-xs font-black uppercase tracking-wider ${
                    section.measurable ? tone.text : 'text-slate-400'
                  }`}
                >
                  {section.measurable ? `${gaps} gap${gaps === 1 ? '' : 's'} found` : 'Not measurable'}
                </p>
              </div>
            );
          })}
        </section>

        {/* Measured gaps first, then a band — never a made-up call count */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-amber-600 shrink-0">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">What this is likely costing you</h2>
              <p className="text-xs font-semibold text-slate-400">
                Measured gaps first, then a band — never an invented call count
              </p>
            </div>
          </div>

          <p className="text-slate-700 font-semibold leading-relaxed">{report.opportunity.headline}</p>

          {report.opportunity.uplift && (
            <div className="mt-5 rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
              <p className="text-sm font-bold text-[#0F5C4D]">
                Closing the gaps below is worth roughly{' '}
                <span className="text-2xl font-black">
                  +{report.opportunity.uplift.low}–{report.opportunity.uplift.high}%
                </span>{' '}
                more enquiries.
              </p>
              <label
                htmlFor="enquiries"
                className="block mt-4 text-[10px] font-black uppercase tracking-wider text-[#0F5C4D]"
              >
                Optional: your calls or enquiries a month
              </label>
              <input
                id="enquiries"
                inputMode="numeric"
                value={enquiries}
                onChange={(event) => setEnquiries(event.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                placeholder="e.g. 60"
                className="mt-1 w-32 px-3 py-2 rounded-xl border border-emerald-200 bg-white text-slate-800 font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <p className="text-sm font-bold text-slate-700 mt-3">
                {monthly
                  ? `That is about ${monthly.low}–${monthly.high} extra enquiries a month.`
                  : 'Add your own monthly number to see the band in calls.'}
              </p>
            </div>
          )}

          <dl className="mt-5 space-y-2.5">
            {report.opportunity.basis.map((row) => (
              <div key={row.label} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <dt className="text-slate-500 font-semibold">{row.label}</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">{row.value}</span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      row.kind === 'measured'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                  >
                    {row.kind}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* You vs the business Google ranks for the same search */}
        {report.competitor && report.benchmark.length > 0 && (
          <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[#0F5C4D] shrink-0">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Head to head</h2>
                <p className="text-xs font-semibold text-slate-400">
                  You vs {report.competitor.name} — the best-ranked other business Google returned
                  for “{report.trade.keywords[0]}” near you
                </p>
              </div>
            </div>

            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-black">Signal</th>
                    <th className="pb-3 font-black text-center">You</th>
                    <th className="pb-3 font-black text-center">{report.competitor.name}</th>
                    <th className="pb-3 font-black text-right">Verdict</th>
                  </tr>
                </thead>
                <tbody>
                  {report.benchmark.map((row) => {
                    const verdict =
                      row.status === 'ahead'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : row.status === 'behind'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200';
                    return (
                      <tr key={row.id} className="border-t border-slate-100">
                        <td className="py-2.5 font-semibold text-slate-600">{row.label}</td>
                        <td className="py-2.5 text-center font-black text-slate-800">{row.you}</td>
                        <td className="py-2.5 text-center font-semibold text-slate-500">{row.them}</td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${verdict}`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs font-semibold text-slate-400 mt-4">
              Every row above came from the same public Google call as your audit. Photo counts are
              capped at the 10 Google exposes publicly.
            </p>
          </section>
        )}

        {/* The same comparison, with the rows still behind the unlock */}
        {locked && report.competitor && (
          <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
            <div className="flex items-start gap-3 mb-5">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[#0F5C4D] shrink-0">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">Head to head</h2>
                <p className="text-xs font-semibold text-slate-400">
                  You vs {report.competitor.name} — the best-ranked other business Google returned
                  for “{report.trade.keywords[0]}” near you
                </p>
              </div>
            </div>

            <LockedPanel
              title={`${report.competitor.name}: ${report.competitor.rating.toFixed(1)}★ from ${report.competitor.reviewCount} reviews`}
              body="The row-by-row comparison — reviews, photos, rating, distance from the top — is sent with your report."
            />
          </section>
        )}

        {/* The fix list, in the order that moves the score */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
          <div className="flex items-start gap-3 mb-5">
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[#0F5C4D] shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800">What to fix, in order</h2>
              <p className="text-xs font-semibold text-slate-400">
                {locked
                  ? 'The fix list is worth more than the score — it is the part that moves it.'
                  : 'Every line is something we could actually see. The flag is priority, not a verdict on your business.'}
              </p>
            </div>
          </div>

          {locked ? (
            <LockedPanel
              title={
                (report.roadmapTotal ?? 0) > 0
                  ? `${report.roadmapTotal} fixes found${
                      (report.roadmapRedCount ?? 0) > 0 ? ` · ${report.roadmapRedCount} urgent` : ''
                    }`
                  : 'Your fix list'
              }
              body="Each fix says what we saw, why it holds you back and the one change that flips it. Send the report to yourself and it opens here in full."
            />
          ) : (
            <div className="space-y-6">
            {PRIORITY_GROUPS.map((group) => {
              const steps = report.roadmap.filter((step) => step.priority === group.key);
              if (steps.length === 0) return null;

              return (
                <div key={group.key}>
                  <h3 className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <span aria-hidden>{group.dot}</span>
                    <span>{group.title}</span>
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      {steps.length}
                    </span>
                  </h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5 mb-2">{group.blurb}</p>
                  <ol className="space-y-2">
                    {steps.map((step) => (
                      <li key={step.id} className={`rounded-2xl border p-4 ${group.card}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-extrabold text-slate-800 text-sm">{step.label}</p>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            {step.sectionLabel}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 font-semibold mt-1">{step.detail}</p>
                        {step.action && (
                          <p className="text-sm text-[#0F5C4D] font-bold mt-2">&rarr; {step.action}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}

            {report.roadmap.length === 0 && (
              <p className="text-sm font-semibold text-slate-500">
                Nothing failed. Keep your review and photo cadence going — that is what holds the position.
              </p>
            )}
            </div>
          )}
        </section>

        {/* Every check, including the ones only the owner can see */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
          <h2 className="text-lg font-black text-slate-800 mb-1">The evidence</h2>
          <p className="text-xs font-semibold text-slate-400 mb-5">
            {locked
              ? 'What each check actually found — including the ones only you can verify.'
              : report.manualCheckCount > 0
                ? `${report.manualCheckCount} signal${
                    report.manualCheckCount === 1 ? '' : 's'
                  } only you can see. Those are listed, never scored.`
                : 'Every check below came from Google or your own website.'}
          </p>

          {locked ? (
            <LockedPanel
              title={`${checkedCount} checks ran · ${failedCount} failed`}
              body="The evidence lists every check, what we observed and the ones we could not verify — so you can see exactly why the score is what it is."
            />
          ) : (
            <div className="space-y-6">
              {(Object.keys(SECTION_META) as AuditSectionKey[]).map((key) => {
                const section: AuditSection = report.sections[key];
                const findings = [...section.findings].sort(
                  (a, b) => findingOrder(a) - findingOrder(b)
                );

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                      <h3 className="font-black text-slate-700 text-sm">{section.label}</h3>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {section.measurable ? `${section.score}/100` : 'Not measurable'}
                      </span>
                    </div>
                    <ul className="divide-y divide-slate-50">
                      {findings.map((finding) => (
                        <FindingRow key={finding.id} finding={finding} />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs font-semibold text-slate-400 mt-6 leading-relaxed">
            How this is scored: each check carries a weight inside its section. A section score is
            the share of the <em>verified</em> weight you earned, and the overall score is the
            weighted mean of the sections we could measure. Signals marked “check manually” carry no
            weight, so something we cannot see can never move your score in either direction.
          </p>
        </section>

        <GetReportCard
          placeId={placeId}
          businessName={businessName}
          score={report.scores.overall}
          locked={locked}
          fixes={report.roadmapTotal ?? report.roadmap.length}
          onUnlocked={onUnlocked}
        />

        <AuditReviewPrompt placeId={placeId} />

        <p className="text-center text-xs font-semibold text-slate-400 pb-6">
          Built from Google Places public data and a fetch of your own website. We never buy, scrape
          or guess at a signal we cannot show you.
        </p>
      </div>
    </div>
  );
}

/**
 * A business name long enough to push the card heading onto three lines is
 * shortened; the full name still travels in the URL and the report itself.
 */
const MAX_HEADING_NAME = 48;

function shortBusinessName(name: string | null): string {
  const clean = (name || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= MAX_HEADING_NAME) return clean;
  return `${clean.slice(0, MAX_HEADING_NAME - 1).trimEnd()}\u2026`;
}

/** Same shape as EMAIL_RE in /api/audit/report/send, so a button is never enabled for a body the API would reject. */
const EMAIL_READY_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** TRUE once the chosen channel carries a contact the send route accepts (8-15 digits, or a real-looking address). */
function contactIsReady(channel: 'email' | 'whatsapp', email: string, phone: string): boolean {
  if (channel === 'email') return EMAIL_READY_RE.test(email.trim());
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

/**
 * "Get your report" — the delivery step of the funnel, and the only place the
 * report unlocks. The lead itself was already captured server-side by
 * /api/audit/run; this card adds a contact and, in exchange, the token that
 * makes the API hand over the fix list. Link-only on purpose — no image
 * rendering, no storage bucket, and nothing to copy out of the page: the token
 * is stored on the device and re-sent by the page, not pasted into the URL bar.
 *
 * The card asks for a CHOICE, not a checkbox: the primary button is the opt-in
 * (its label IS MARKETING_CONSENT_TEXT, the string the API stores as
 * lead_consent.consent_text) and the secondary button delivers the report and
 * nothing else. Both are real submits, nothing is pre-selected, both stay
 * disabled until the contact field is usable, and neither sends without an
 * activated button - so a stored consent always traces back to one click.
 */
function GetReportCard({
  placeId,
  businessName,
  score,
  locked,
  fixes,
  onUnlocked,
}: {
  placeId: string | null;
  businessName: string | null;
  score: number;
  locked: boolean;
  /** How many fixes the full report holds (already counted server-side). */
  fixes: number;
  onUnlocked: (token: string) => void;
}) {
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState('');
  // TRUE only when the send that succeeded came from the primary (opt-in)
  // button on the email channel: WhatsApp follow-ups are email-only sequences,
  // so no preview is promised there.
  const [sentWithPreview, setSentWithPreview] = useState(false);
  const [error, setError] = useState('');

  // Sample scans have no shareable link — nothing real was looked up.
  if (!placeId || placeId.startsWith('mock')) return null;

  const ready = contactIsReady(channel, email, phone);

  /**
   * Sends the report for ONE of the two choices. `withPreview` IS the consent:
   * true only when the visitor activated the primary button on the email
   * channel; false for the secondary button and for every WhatsApp send, whose
   * follow-up emails are email-only sequences (see the send route).
   */
  const send = async (withPreview: boolean) => {
    if (sending || !ready) return;
    const marketingConsent = withPreview && channel === 'email';
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/audit/report/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, channel, email, phone, businessName, marketingConsent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Could not send the report');
      setSentTo(channel === 'email' ? email.trim() : phone.trim());
      setSentWithPreview(marketingConsent);
      // Sending IS the unlock: the token comes back here, so the report above
      // turns from teaser into the full fix list without a page reload.
      if (typeof data?.unlock === 'string' && data.unlock) onUnlocked(data.unlock);
    } catch (err: any) {
      setError(err?.message || 'Could not send the report');
    } finally {
      setSending(false);
    }
  };

  /**
   * Both buttons are real submits; the one that was activated names its choice
   * in `value`, and that value is the consent. A submit without a button behind
   * it is ignored rather than guessed at.
   */
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending || !ready) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (!submitter) return;
    void send(submitter.value === 'primary');
  };

  /**
   * Enter inside a field would implicitly "click" the first submit button, i.e.
   * opt in without a decision. It sends the report instead - the neutral choice -
   * and when the contact is not usable yet it asks the browser to show its own
   * "this field is not valid" bubble rather than failing silently.
   */
  const onFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (!ready) {
      event.currentTarget.form?.reportValidity();
      return;
    }
    void send(false);
  };

  const headingName = shortBusinessName(businessName);
  const heading = headingName
    ? `Get your report for ${headingName}`
    : locked
      ? 'Get the full report'
      : 'Get this report';
  // The email primary button IS the consent text; WhatsApp cannot promise the
  // follow-up emails, so its primary only names what is actually delivered.
  const primaryTitle =
    channel === 'email' ? MARKETING_CONSENT_HEADLINE : 'Send my report on WhatsApp';
  const primaryDetail = channel === 'email' ? MARKETING_CONSENT_DETAIL : '+ a free website preview link';

  return (
    <div
      id="get-report"
      className="rounded-3xl border border-[#E1E8E4] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(11,61,46,0.45)] sm:p-6 md:p-8"
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="shrink-0 rounded-xl border border-[#E1E8E4] bg-[#F7F9F8] p-2.5 text-[#0F5132]">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2
            className="break-words text-lg font-black leading-snug text-[#0B3D2E] sm:text-xl"
            title={businessName || undefined}
          >
            {heading}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#5B6B64]">
            {locked
              ? score > 0
                ? `${score}/100 is the headline. The ${fixes} prioritised fix${
                    fixes === 1 ? '' : 'es'
                  } behind it are sent to you — that is the part worth keeping. Sending it unlocks the full report on this page.`
                : `Your prioritised fix list is sent to you — that is the part worth keeping. Sending it unlocks the full report on this page.`
              : score > 0
                ? `Your ${score}/100 report, plus the fix list, as a link you can reopen any time.`
                : 'We will send you the link — you can reopen it any time.'}
          </p>
        </div>
      </div>

      {sentTo ? (
        <div className="py-3 text-center" role="status">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[#E1E8E4] bg-[#F7F9F8]">
            <CheckCircle2 className="h-7 w-7 text-[#22C55E]" aria-hidden />
          </div>
          <p className="font-black text-[#0B3D2E]">Report sent to {sentTo}</p>
          {sentWithPreview && (
            <p className="mt-1 text-sm font-bold text-[#0F5132]">
              Your free website preview is on its way.
            </p>
          )}
          <p className="mt-1 text-sm font-semibold text-[#5B6B64]">
            {locked
              ? 'Unlocked — the full report is now on this page, and the link in that message reopens it any time.'
              : 'The link opens your live report — reopen it after making changes.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSentTo('');
              setSentWithPreview(false);
              setError('');
            }}
            className="mt-4 rounded-sm text-sm font-bold text-[#0F5132] underline underline-offset-2 transition-colors duration-150 hover:text-[#0B3D2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2 motion-reduce:transition-none"
          >
            Send to another address
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" aria-busy={sending}>
          <div
            className="inline-flex rounded-xl bg-[#F7F9F8] p-1"
            role="group"
            aria-label="Delivery channel"
          >
            {(['email', 'whatsapp'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={channel === option}
                onClick={() => {
                  setChannel(option);
                  setError('');
                }}
                className={`min-h-[40px] rounded-lg px-4 py-2 text-sm font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2 motion-reduce:transition-none ${
                  channel === option
                    ? 'bg-white text-[#0F5132] shadow-sm'
                    : 'text-[#5B6B64] hover:text-[#0F5132]'
                }`}
              >
                {option === 'email' ? 'Email' : 'WhatsApp'}
              </button>
            ))}
          </div>

          {channel === 'email' ? (
            <div>
              <label htmlFor="report-email" className="sr-only">
                Email address
              </label>
              <input
                id="report-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onKeyDown={onFieldKeyDown}
                placeholder="you@business.com"
                className="w-full rounded-xl border border-[#E1E8E4] bg-white px-4 py-3 font-semibold text-[#0B3D2E] outline-none transition-colors duration-150 placeholder:text-[#5B6B64] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/30 motion-reduce:transition-none"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="report-phone" className="sr-only">
                WhatsApp number
              </label>
              <input
                id="report-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                onKeyDown={onFieldKeyDown}
                placeholder="+44 7700 900123"
                className="w-full rounded-xl border border-[#E1E8E4] bg-white px-4 py-3 font-semibold text-[#0B3D2E] outline-none transition-colors duration-150 placeholder:text-[#5B6B64] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/30 motion-reduce:transition-none"
              />
              <p className="text-xs font-semibold text-[#5B6B64]">
                Include the country code so the message reaches the right number.
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm font-bold text-rose-600">
              {error}
            </p>
          )}

          {/* Announces the wait even when the spinner is frozen by reduced motion. */}
          <p className="sr-only" role="status" aria-live="polite">
            {sending ? 'Sending your report…' : ''}
          </p>

          <div className="space-y-3">
            {/* Primary = the opt-in. Its two lines are MARKETING_CONSENT_TEXT
                split in lib/consent.ts, so the label here and the stored
                lead_consent.consent_text are the same words. */}
            <button
              type="submit"
              name="choice"
              value="primary"
              disabled={!ready || sending}
              onClick={() =>
                trackEvent('report_card_primary_click', {
                  channel,
                  marketing_consent: channel === 'email',
                })
              }
              className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#22C55E]/40 focus-visible:ring-offset-2 motion-reduce:transition-none sm:px-5 sm:py-4 ${
                ready
                  ? 'border-[#22C55E] bg-[#22C55E] text-white shadow-[0_12px_28px_-16px_rgba(15,81,50,0.65)] hover:border-[#16A34A] hover:bg-[#16A34A]'
                  : 'cursor-not-allowed border-[#E1E8E4] bg-[#F7F9F8] text-[#5B6B64]'
              } ${sending ? 'cursor-wait' : ''}`}
            >
              {sending ? (
                <Loader2
                  className="mt-0.5 h-5 w-5 shrink-0 animate-spin motion-reduce:animate-none"
                  aria-hidden
                />
              ) : channel === 'email' ? (
                <Mail className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              ) : (
                <MessageSquare className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              )}
              <span className="min-w-0">
                <span className="block text-balance text-[15px] leading-snug sm:text-base">
                  {primaryTitle}
                </span>
                {primaryDetail && (
                  <span
                    className={`mt-0.5 block text-pretty text-xs font-semibold leading-snug ${
                      ready ? 'text-white/90' : 'text-[#5B6B64]'
                    }`}
                  >
                    {primaryDetail}
                  </span>
                )}
              </span>
            </button>

            {/* Secondary = report only, same width as the primary and never
                greyed out while it is usable. */}
            <button
              type="submit"
              name="choice"
              value="secondary"
              disabled={!ready || sending}
              onClick={() =>
                trackEvent('report_card_secondary_click', {
                  channel,
                  marketing_consent: false,
                })
              }
              className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#22C55E]/40 focus-visible:ring-offset-2 motion-reduce:transition-none sm:text-base ${
                ready
                  ? 'border-[#0F5132] bg-white text-[#0F5132] hover:bg-[#F7F9F8]'
                  : 'cursor-not-allowed border-[#E1E8E4] bg-[#F7F9F8] text-[#5B6B64]'
              } ${sending ? 'cursor-wait' : ''}`}
            >
              {sending && (
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
              )}
              Just send my report
            </button>
          </div>

          <p className="text-center text-xs font-semibold text-[#5B6B64]">
            We only email what you choose.{' '}
            <Link
              href={PRIVACY_POLICY_PATH}
              className="rounded-sm font-bold text-[#0F5132] underline decoration-[#22C55E] decoration-2 underline-offset-2 transition-colors duration-150 hover:text-[#0B3D2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              Privacy policy
            </Link>
            .
          </p>
        </form>
      )}
    </div>
  );
}

/**
 * What a gated panel shows instead of its contents: how much is behind the
 * unlock, and one button that scrolls to the card that opens it. The text is
 * deliberately specific ("12 fixes found · 4 urgent") - a vague padlock reads
 * like a paywall, a counted one reads like a report waiting to be sent.
 */
function LockedPanel({ title, body }: { title: string; body: string }) {
  const focusCard = () => {
    document.getElementById('get-report')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="rounded-2xl border border-dashed border-emerald-200 bg-[linear-gradient(180deg,#F6FBF8_0%,#FFFFFF_100%)] p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
        <Lock className="w-5 h-5 text-[#0F5C4D]" />
      </div>
      <p className="font-black text-slate-800">{title}</p>
      <p className="text-sm font-semibold text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
        {body}
      </p>
      <button
        type="button"
        onClick={focusCard}
        className="mt-4 inline-flex items-center gap-2 bg-[#0F5C4D] hover:bg-[#073a30] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md"
      >
        <Mail className="w-4 h-4" />
        Send me the report
      </button>
    </div>
  );
}

// ─── Small presentational pieces ─────────────────────────────────────────────

/** Failures first, then the items only the owner can check, then the passes. */
function findingOrder(finding: AuditFinding): number {
  if (finding.status === 'fail') return 0;
  if (finding.status === 'manual') return 1;
  return 2;
}

/**
 * Roadmap groups. The emoji is the priority flag from the brief: red = a
 * verified fail worth the most points, amber = a smaller verified fail, green =
 * a signal Google does not publish (look, then decide).
 */
const PRIORITY_GROUPS = [
  {
    key: 'red' as const,
    dot: '🔴',
    title: 'Do this first',
    blurb: 'A verified gap that is worth the most points.',
    card: 'border-rose-100 bg-rose-50/50',
  },
  {
    key: 'amber' as const,
    dot: '🟡',
    title: 'Next',
    blurb: 'Smaller verified gaps — quick wins once the reds are done.',
    card: 'border-amber-100 bg-amber-50/50',
  },
  {
    key: 'green' as const,
    dot: '🟢',
    title: 'Check in your Google dashboard',
    blurb: 'Google does not publish these, so we will not score them. Look, then decide.',
    card: 'border-emerald-100 bg-emerald-50/50',
  },
];

function Fact({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="font-black text-slate-800 leading-tight">{value}</p>
        <p className="text-[11px] font-semibold text-slate-400 truncate">{label}</p>
      </div>
    </div>
  );
}

function FindingRow({ finding }: { finding: AuditFinding }) {
  const badge =
    finding.status === 'pass' ? (
      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100">
        <CheckCircle2 className="w-3 h-3" /> Passed
      </span>
    ) : finding.status === 'fail' ? (
      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-100">
        <XCircle className="w-3 h-3" /> Missing
      </span>
    ) : (
      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-slate-50 text-slate-500 border-slate-200">
        <HelpCircle className="w-3 h-3" /> Check manually
      </span>
    );

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-slate-700">{finding.label}</p>
        {badge}
      </div>
      <p className="text-xs font-semibold text-slate-500 mt-1">{finding.detail}</p>
      {finding.fix && <p className="text-xs font-bold text-[#0F5C4D] mt-1">&rarr; {finding.fix}</p>}
    </li>
  );
}
