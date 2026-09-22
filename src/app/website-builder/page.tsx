import Link from "next/link";
import { ROUTES, SITE_URL } from "@/lib/routes";
import { WEBSITE_BUILDER_FAQS } from "@/lib/website-builder-faqs";
import {
  HOSTING_FREE_DAYS,
  HOSTING_PRICE_USD,
  WEBSITE_EARLY_ADOPTER_ENDS,
  WEBSITE_SETUP_PRICE_USD,
  isEarlyAdopterWindowOpen,
} from "@/lib/website";
import PreviewWidget from "./PreviewWidget";

/**
 * /website-builder — server component.
 *
 * The interactive part is the client widget (./PreviewWidget): a live Google
 * Business Profile lookup that previews the site the visitor would get. Every
 * word that must exist for crawlers lives here in the server component, along
 * with all four JSON-LD blocks (BreadcrumbList, WebPage, SoftwareApplication,
 * FAQPage) — separate scripts, matching /gmb-audit-tool.
 *
 * PRICING: never hardcode a "free" claim. The offer renders from
 * isEarlyAdopterWindowOpen() (src/lib/website.ts) so the copy AND the
 * SoftwareApplication offer switch themselves when the early-adopter window
 * closes. Prerendered + revalidated hourly, so the switch lands within an hour.
 */
export const revalidate = 3600;

const PAGE_URL = `${SITE_URL}${ROUTES.WEBSITE_BUILDER}`;

export default function WebsiteBuilderPage() {
  const earlyAdopter = isEarlyAdopterWindowOpen();
  // Date-only (YYYY-MM-DD) for the offer's priceValidUntil.
  const offerValidUntil = new Date(WEBSITE_EARLY_ADOPTER_ENDS).toISOString().slice(0, 10);

  // Schema.org structured data - BreadcrumbList: Home > Website Builder
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/" },
      { "@type": "ListItem", "position": 2, "name": "Website Builder", "item": PAGE_URL }
    ]
  };

  // Schema.org structured data - WebPage
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": PAGE_URL,
    "url": PAGE_URL,
    "name": "The Website Builder That Stays in Sync With Your Google Business Profile",
    "description":
      "Build a website from your Google Business Profile in one tap — synced as your profile changes.",
    "isPartOf": { "@type": "WebSite", "name": "Neerzy", "url": SITE_URL },
    "datePublished": "2026-09-22",
    "dateModified": "2026-09-22"
  };

  // Schema.org structured data - SoftwareApplication (the builder itself).
  // The offer is window-aware: inside the early-adopter window the setup fee is
  // waived and the first 90 days of hosting are free (price 0 + validUntil);
  // after it, the standard $10/month hosting price is published instead.
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Neerzy Website Builder",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "url": PAGE_URL,
    "description":
      "A website builder for local service businesses that builds a site in one tap from a connected Google Business Profile and keeps it synced as the profile updates.",
    "offers": {
      "@type": "Offer",
      "price": earlyAdopter ? "0" : String(HOSTING_PRICE_USD),
      "priceCurrency": "USD",
      "description": earlyAdopter
        ? `Setup fee ($${WEBSITE_SETUP_PRICE_USD}) waived and the first ${HOSTING_FREE_DAYS} days of hosting free for early adopters, then $${HOSTING_PRICE_USD}/month. Requires a paid Neerzy plan.`
        : `Standard pricing: $${HOSTING_PRICE_USD}/month hosting. Requires a paid Neerzy plan.`,
      ...(earlyAdopter ? { priceValidUntil: offerValidUntil } : {}),
    },
    "publisher": { "@type": "Organization", "name": "Neerzy", "url": SITE_URL }
  };

  // Schema.org structured data - FAQPage, built from the same array the visible
  // accordion renders (Google requires the two to match).
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": WEBSITE_BUILDER_FAQS.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
    }))
  };

  const ctaLabel = earlyAdopter ? "Get My Free Website" : "Build My Website";

  return (
    <>
      {/* SEO: JSON-LD structured data (BreadcrumbList, WebPage, SoftwareApplication, FAQPage) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="container">
          <nav
            aria-label="Breadcrumb"
            style={{
              fontSize: "var(--text-small-size)",
              color: "var(--color-text-secondary)",
              marginBottom: "var(--space-4)",
            }}
          >
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <li>
                <Link href="/" style={{ color: "var(--color-text-secondary)" }}>
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>Website Builder</li>
            </ol>
          </nav>

          <div style={{ maxWidth: "820px" }}>
            <h1
              style={{
                fontSize: "var(--text-hero-size)",
                lineHeight: "var(--text-hero-line)",
                fontWeight: "var(--text-hero-weight)",
                color: "var(--color-primary)",
                letterSpacing: "-0.02em",
                marginBottom: "var(--space-3)",
              }}
            >
              The Website Builder That Stays in Sync With Your Google Business Profile
            </h1>

            <p style={{ fontSize: "var(--text-h3-size)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
              Build a real website in one tap. No design skill needed.
              {earlyAdopter
                ? ` Setup fee waived and first ${HOSTING_FREE_DAYS} days of hosting free for early adopters.`
                : ` Setup fee $${WEBSITE_SETUP_PRICE_USD} and hosting $${HOSTING_PRICE_USD}/month.`}
            </p>

            <p style={{ fontSize: "var(--text-body-size)", color: "var(--color-text-secondary)", marginBottom: "var(--space-5)" }}>
              Most website builders ask you to start from a blank page. Neerzy starts from something
              you have already built — your Google Business Profile — and keeps your website updated
              as that profile changes.
            </p>
          </div>

          {/* Live GBP lookup → "your future site" preview (client component). */}
          <PreviewWidget />

          <div style={{ marginTop: "var(--space-5)" }}>
            <Link href="/signup" className="btn btn-primary">
              {ctaLabel} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why sync beats a one-time import ─────────────────── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg-soft)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>Most website builders import your profile once. Neerzy keeps syncing.</h2>
            <p>
              Plenty of tools can pull your business name, hours, and photos from Google once, at
              setup. What most of them don&apos;t do is keep that connection alive afterwards — so your
              website quietly goes stale the first time you add a new photo or your hours change for
              the holidays.
            </p>
            <p>
              Neerzy is built differently: your website stays connected to your Google Business
              Profile, not just copied from it once.
            </p>
          </div>

          <div className="price-table-wrap">
            <table className="price-table">
              <thead>
                <tr>
                  <th>What matters</th>
                  <th>One-time import tools</th>
                  <th>Neerzy</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pulls your data from Google at setup</td>
                  <td>✅</td>
                  <td>✅</td>
                </tr>
                <tr className="highlight">
                  <td>Updates automatically when your profile changes later</td>
                  <td>❌</td>
                  <td>✅</td>
                </tr>
                <tr>
                  <td>Built for your specific trade</td>
                  <td>Often generic</td>
                  <td>10 trade-specific templates</td>
                </tr>
                <tr>
                  <td>No design or coding skill required</td>
                  <td>Varies by tool</td>
                  <td>✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>How it works</h2>
            <p>Four steps, about a minute of your time, and only one of them involves you tapping anything.</p>
          </div>

          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <li className="card" style={{ padding: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-h3-size)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                1. Connect your profile
              </h3>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Sign in with the Google account connected to your{" "}
                <Link href={ROUTES.AUDIT_TOOL} style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                  connected Google Business Profile
                </Link>
                . About 30 seconds.
              </p>
            </li>
            <li className="card" style={{ padding: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-h3-size)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                2. Pick your trade template
              </h3>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Neerzy shows templates matched to your business category — plumber, electrician, HVAC,
                roofer, cleaner, pet groomer and more.
              </p>
            </li>
            <li className="card" style={{ padding: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-h3-size)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                3. Tap “Build My Website”
              </h3>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Your site goes live with your real business name, address, hours, photos and reviews
                already filled in.
              </p>
            </li>
            <li className="card" style={{ padding: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-h3-size)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                4. Keep working
              </h3>
              <p style={{ color: "var(--color-text-secondary)" }}>
                New job photo, new review, updated hours — your website reflects it without you
                touching it again.
              </p>
            </li>
          </ol>
        </div>
      </section>

      {/* ── Google shut its own tool down ─────────────────────── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg-soft)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>Why Google shutting down its own website tool is your opportunity</h2>
          </div>
          <div style={{ maxWidth: "780px", color: "var(--color-text-secondary)", fontSize: "var(--text-body-size)" }}>
            <p style={{ marginBottom: "var(--space-3)" }}>
              Google used to offer a basic website builder built directly into Google Business
              Profile. That feature has been discontinued — businesses that relied on it now need to
              rebuild somewhere else.
            </p>
            <p>
              Neerzy picks up exactly where that gap was left, with something more capable than what
              Google offered: your site is generated from the profile you already have, and it keeps
              syncing with it. An ongoing connection, not a one-time export.
            </p>
          </div>
        </div>
      </section>

      {/* ── Built for your trade ─────────────────────────────── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>Built for your trade, not a generic template</h2>
            <p>
              A plumber&apos;s website and a pet groomer&apos;s website shouldn&apos;t look the same. Neerzy matches
              your template to your Google Business Profile category automatically — plumbing,
              electrical, HVAC, roofing, cleaning, pet grooming and more — instead of handing you a
              one-size-fits-all layout to fill in yourself.
            </p>
          </div>
          <p style={{ marginBottom: "var(--space-4)" }}>
            <Link href="/site/templates" className="btn btn-secondary">
              See example templates →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Early Adopter Offer (window-aware) ───────────────── */}
      <section id="offer" className="section-padding" style={{ backgroundColor: "var(--color-bg-soft)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>Early Adopter Offer</h2>
          </div>

          <div className="price-card">
            <div className="price-card-main">
              {earlyAdopter ? (
                <>
                  <span className="price-card-strike">${WEBSITE_SETUP_PRICE_USD}</span>
                  <span className="price-card-amount">FREE</span>
                  <span className="price-card-once">setup fee, for early adopters</span>
                </>
              ) : (
                <>
                  <span className="price-card-amount">${WEBSITE_SETUP_PRICE_USD}</span>
                  <span className="price-card-once">one-time setup, then hosting monthly</span>
                </>
              )}
            </div>
            <ul className="price-card-list">
              {earlyAdopter ? (
                <>
                  <li>Setup fee waived — yours to keep.</li>
                  <li>First {HOSTING_FREE_DAYS} days of hosting free.</li>
                  <li>
                    Then{" "}
                    <Link href="/pricing" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                      ${HOSTING_PRICE_USD}/month
                    </Link>{" "}
                    hosting.
                  </li>
                </>
              ) : (
                <>
                  <li>Setup fee ${WEBSITE_SETUP_PRICE_USD} one-time.</li>
                  <li>Hosting ${HOSTING_PRICE_USD}/month.</li>
                  <li>Your own domain, $19 once.</li>
                </>
              )}
              <li>Requires a paid Neerzy plan. Custom domain $19 one-time.</li>
            </ul>
            <Link href="/signup" className="btn btn-primary">
              {earlyAdopter ? "Claim My Free 90 Days" : "Build My Website"} →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQs ─────────────────────────────────────────────── */}
      <section id="faqs" className="section-padding" style={{ backgroundColor: "var(--color-bg)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>FAQs</h2>
          </div>

          {/* Rendered from WEBSITE_BUILDER_FAQS — the same array the FAQPage
              JSON-LD above is built from, so the two can never drift apart.
              Native <details> keeps this a server component and leaves every
              answer in the HTML source for crawlers. */}
          <div style={{ display: "grid", gap: "var(--space-3)", maxWidth: "820px" }}>
            {WEBSITE_BUILDER_FAQS.map((faq) => (
              <details key={faq.question} className="card" style={{ padding: 0, overflow: "hidden" }}>
                <summary
                  style={{
                    padding: "var(--space-4)",
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-family)",
                  }}
                >
                  {faq.question}
                </summary>
                <div
                  style={{
                    padding: "0 var(--space-4) var(--space-4)",
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--text-body-size)",
                    lineHeight: "var(--text-body-line)",
                  }}
                >
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg-soft)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>Every job can bring the next one.</h2>
            <p>
              Keep your photos flowing, your Google profile fresh, and now — your website current too.
              All from one tap.
            </p>
          </div>
          <Link href="/signup" className="btn btn-primary">
            {ctaLabel} →
          </Link>
        </div>
      </section>
    </>
  );
}
