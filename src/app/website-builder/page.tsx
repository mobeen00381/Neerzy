import Link from "next/link";
import { ROUTES, SITE_URL } from "@/lib/routes";
import { WEBSITE_BUILDER_FAQS } from "@/lib/website-builder-faqs";
import { HOSTING_FREE_DAYS, HOSTING_PRICE_USD } from "@/lib/website";
import { TRADE_LANDINGS } from "@/lib/website-builder-trades";
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
 * PRICING: the model is quoted from src/lib/website.ts so the copy can never
 * drift from billing — the build is FREE, the domain is $19 once, hosting is
 * free for the first HOSTING_FREE_DAYS days and then $HOSTING_PRICE_USD/month.
 * The old $99 early-adopter setup fee was retired. Live Google sync runs on
 * paid plans only (see WEBSITE_SYNC_ELIGIBLE_PLANS).
 */
export const revalidate = 3600;

const PAGE_URL = `${SITE_URL}${ROUTES.WEBSITE_BUILDER}`;

export default function WebsiteBuilderPage() {

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
    "name": "Website Builder for Your Google Business Profile",
    "description":
      "Preview a website built from your Google Business Profile free. Publish for $19, first 90 days hosting free. Stays in sync on any paid plan.",
    "isPartOf": { "@type": "WebSite", "name": "Neerzy", "url": SITE_URL },
    "datePublished": "2026-09-22",
    "dateModified": "2026-09-22"
  };

  // Schema.org structured data - SoftwareApplication (the builder itself).
  // Pricing is flat and honest: free build, $19 domain, 90 days free hosting.
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
      "price": "0",
      "priceCurrency": "USD",
      "description": `Free website build, $19 one-time custom domain, and the first ${HOSTING_FREE_DAYS} days of hosting free, then $${HOSTING_PRICE_USD}/month. Live Google sync requires a paid Neerzy plan.`,
      "category": "Free build · paid hosting",
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

  const ctaLabel = "See My Website Preview — Free";
  const closingCtaLabel = "Get My Free Website Preview";

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
              The Website Builder Built From Your Google Business Profile
            </h1>

            <p style={{ fontSize: "var(--text-h3-size)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
              Search your business, see your site in under a minute — free. Publish it on your own
              domain for $19, and it keeps itself in sync with your Google profile on any paid plan.
            </p>

            <p style={{ fontSize: "var(--text-body-size)", color: "var(--color-text-secondary)", marginBottom: "var(--space-5)" }}>
              Most website builders start you from a blank page. Neerzy starts from something you
              already have — your Google Business Profile — and turns it into a real website, in your
              business name, in minutes.
            </p>
          </div>

          {/* Live GBP lookup → "your future site" preview (client component). */}
          <PreviewWidget />

          <div style={{ marginTop: "var(--space-5)" }}>
            <Link href="/signup" className="btn btn-primary">
              {ctaLabel} →
            </Link>
            <p style={{ marginTop: "var(--space-3)", fontSize: "var(--text-small-size)", color: "var(--color-text-secondary)" }}>
              Preview only — publishing needs your own domain ($19, once). No card required to preview.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why sync beats a one-time import ─────────────────── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg-soft)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>Most website builders import your profile once. Neerzy can keep syncing.</h2>
            <p>
              Plenty of tools pull your business name, hours and photos from Google once, at setup —
              then the connection goes quiet, so your site slowly falls behind your real profile.
            </p>
            <p>
              On a paid Neerzy plan, your website stays connected: new job photos, updated hours and
              new reviews flow through automatically. On the free start, your site is still built from
              real data — the live sync turns on with a plan.
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
                  <td>Keeps syncing automatically (paid plans)</td>
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
            <p>Four steps. The first two are free — the site only goes live once you add a domain.</p>
          </div>

          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <li className="card" style={{ padding: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-h3-size)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                1. Connect your profile
              </h3>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Sign in with the Google account connected to your{" "}
                <Link href={ROUTES.AUDIT_TOOL} style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                  Google Business Profile
                </Link>
                . About 30 seconds.
              </p>
            </li>
            <li className="card" style={{ padding: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-h3-size)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                2. Pick your trade template
              </h3>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Neerzy shows templates matched to your business category.
              </p>
            </li>
            <li className="card" style={{ padding: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-h3-size)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                3. Preview it — free
              </h3>
              <p style={{ color: "var(--color-text-secondary)" }}>
                See your real name, address, hours, photos and reviews already filled in. Nothing is
                published yet.
              </p>
            </li>
            <li className="card" style={{ padding: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-h3-size)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                4. Publish on your own domain
              </h3>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Register a domain for $19 (once, in your name) and your site goes live. The first{" "}
                {HOSTING_FREE_DAYS} days of hosting are free.
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
              Google used to offer a basic website builder built into Google Business Profile.{" "}
              <a
                href="https://support.google.com/business/answer/14341729"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--color-primary)", fontWeight: 600 }}
              >
                That feature was discontinued in March 2024
              </a>{" "}
              — businesses that relied on it were redirected back to their plain Business Profile,
              with no way to edit the old site.
            </p>
            <p>
              Neerzy picks up where that gap was left: your site is generated from the profile you
              already have, built for your trade, and — on a paid plan — kept in sync with it going
              forward.
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
              A plumber&apos;s website and a dentist&apos;s website shouldn&apos;t look the same. Neerzy matches
              your template to your Google Business Profile category automatically:
            </p>
          </div>
          <p style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", maxWidth: "900px" }}>
            {TRADE_LANDINGS.map((t) => (
              <Link
                key={t.slug}
                href={`${ROUTES.WEBSITE_BUILDER}/${t.slug}`}
                style={{ color: "var(--color-primary)", fontWeight: 600 }}
              >
                {t.h1.replace("Website Builder for ", "")}
              </Link>
            ))}
          </p>
          <p style={{ marginBottom: "var(--space-4)" }}>
            <Link href="/site/templates" className="btn btn-secondary">
              See example templates →
            </Link>
          </p>
        </div>
      </section>

      {/* ── What it costs ────────────────────────────────────── */}
      <section id="offer" className="section-padding" style={{ backgroundColor: "var(--color-bg-soft)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>What it costs</h2>
            <p>One price to publish. Nothing to design, nothing to code.</p>
          </div>

          <div className="price-card">
            <div className="price-card-main">
              <span className="price-card-amount">FREE</span>
              <span className="price-card-once">to preview your website</span>
            </div>
            <ul className="price-card-list">
              <li>
                <strong>Free, to start:</strong> Google Score audit, 5 Google posts + 5 review
                requests for 30 days, and a website preview — no card.
              </li>
              <li>
                <strong>To publish:</strong> $19 once — your own domain, registered in your name.
              </li>
              <li>
                <strong>Hosting:</strong> free for the first {HOSTING_FREE_DAYS} days, then{" "}
                <Link href="/pricing" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                  ${HOSTING_PRICE_USD}/month
                </Link>
                .
              </li>
              <li>
                <strong>Live sync:</strong> new photos and reviews update your site automatically on
                any paid plan.
              </li>
              <li>
                <strong>After day 30:</strong> posting and review requests pause — your website stays
                live, showing your last update.
              </li>
              <li>
                <strong>After day 90 from publish:</strong> without payment your site goes offline
                (not deleted) — you have 30 days to bring it back exactly as it was.
              </li>
            </ul>
            <Link href="/signup" className="btn btn-primary">
              Build My Website — Free Preview →
            </Link>
            <p style={{ marginTop: "var(--space-3)", fontSize: "var(--text-small-size)", color: "var(--color-text-secondary)" }}>
              No card required to preview. Domain and hosting costs apply to publish and keep it live.
            </p>
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
              Keep your photos flowing, your Google profile fresh, and your website current too.
            </p>
          </div>
          <Link href="/signup" className="btn btn-primary">
            {closingCtaLabel} →
          </Link>
        </div>
      </section>
    </>
  );
}
