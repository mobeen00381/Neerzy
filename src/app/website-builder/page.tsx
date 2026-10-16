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
 *
 * AEO STRUCTURE: the page is deliberately shaped as a question-shaped H2
 * ("Why Local Businesses & Trades Switch to Neerzy") with named, self-contained
 * H3 benefit claims underneath, then a three-point pricing block and an FAQ,
 * because that is the shape Google AI Overviews and LLMs chunk most reliably.
 * Heading order is H1 → H2 → H3, never skipping a level.
 *
 * NO aggregateRating. Deliberate, not an oversight: the page shows no reviews
 * of its own, so a self-serving star rating in SoftwareApplication schema would
 * be an unverifiable claim — a structured-data policy risk on Google and a
 * trust penalty with AI answer engines that cross-check schema against content.
 * Add it only when real, on-page reviews exist.
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
    "name": "The Instant Google Business Profile Website Builder",
    "description":
      "Build a free website from your Google Business Profile in 60s. Pulls in reviews, photos & hours. First 90 days hosting free. No coding needed.",
    "isPartOf": { "@type": "WebSite", "name": "Neerzy", "url": SITE_URL },
    "datePublished": "2026-09-22",
    "dateModified": "2026-10-16"
  };

  // Schema.org structured data - SoftwareApplication (the builder itself).
  // Pricing is flat and honest: free build, $19 domain, 90 days free hosting.
  // No aggregateRating — see the file header for why.
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Neerzy Google Business Profile Website Builder",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "url": PAGE_URL,
    "description":
      "A website builder for local service businesses that builds a site in one tap from a connected Google Business Profile and keeps it synced as the profile updates.",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD",
      "description": `Free website build with ${HOSTING_FREE_DAYS} days of free hosting. Optional custom domain for $19 once; hosting is then $${HOSTING_PRICE_USD}/month. Live Google sync requires a paid Neerzy plan.`,
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

  const ctaLabel = "Build My Free Website";
  const closingCtaLabel = "Build My Free Website";

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
              The Instant Google Business Profile Website Builder
            </h1>

            <p style={{ fontSize: "var(--text-h3-size)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
              Turn your Google Business Profile into a fast, mobile-friendly website in 60 seconds —
              pulling in your reviews, services, hours and job photos. Free setup with 90 days of free
              hosting.
            </p>

            <p style={{ fontSize: "var(--text-body-size)", color: "var(--color-text-secondary)", marginBottom: "var(--space-5)" }}>
              Most website builders start you from a blank page. Neerzy starts from something you
              already have — your Google Business Profile — and turns it into a real website, in your
              business name, in minutes. Live sync then keeps it current on a paid plan.
            </p>
          </div>

          {/* Live GBP lookup → "your future site" preview (client component). */}
          <PreviewWidget />

          <div style={{ marginTop: "var(--space-5)" }}>
            <Link href="/signup?plan=free" className="btn btn-primary">
              {ctaLabel} →
            </Link>
            <p style={{ marginTop: "var(--space-3)", fontSize: "var(--text-small-size)", color: "var(--color-text-secondary)" }}>
              No credit card required • First {HOSTING_FREE_DAYS} days hosting free • Live in 60s
            </p>
            <p style={{ marginTop: "var(--space-2)", fontSize: "var(--text-small-size)", color: "var(--color-text-secondary)" }}>
              Previewing is free — publishing on your own domain is $19, once, registered in your name.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 1: Why Local Businesses & Trades Switch to Neerzy ──── */}
      {/* One H2 with three named H3 benefit claims — the shape Google AI
          Overviews and LLMs chunk most reliably. The comparison table, the
          trade links and the business.site copy all live under their H3, so
          nothing was lost in the restructure. */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg-soft)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>Why Local Businesses &amp; Trades Switch to Neerzy</h2>
            <p>
              Three reasons owners leave blank-page builders behind — and what happens to the site
              Google used to give them.
            </p>
          </div>

          <div style={{ maxWidth: "900px" }}>
            <h3
              id="automatic-sync"
              style={{ fontSize: "var(--text-h3-size)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}
            >
              Zero-Click Automatic Sync
            </h3>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
              New job photos, updated business hours and fresh Google reviews flow onto your live site
              automatically — no dashboard, no re-import, no manual edits. Plenty of tools pull your
              details from Google once, at setup, then the connection goes quiet and your site slowly
              falls behind your real profile. On a paid Neerzy plan your website stays connected; on
              the free start it is still built from real Google Business Profile data, and live sync
              turns on with a plan.
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

          <div style={{ maxWidth: "900px", marginTop: "var(--space-6)" }}>
            <h3
              id="tailored-templates"
              style={{ fontSize: "var(--text-h3-size)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}
            >
              Tailored to Your Trade
            </h3>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
              A plumber&apos;s website and a dentist&apos;s website shouldn&apos;t look the same. Neerzy matches
              your template to your Google Business Profile category automatically — specific designs
              for plumbers, HVAC contractors, electricians, cleaners, roofers and more:
            </p>
            <p style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
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
            <p>
              <Link href="/site/templates" className="btn btn-secondary">
                See example templates →
              </Link>
            </p>
          </div>

          <div style={{ maxWidth: "900px", marginTop: "var(--space-6)" }}>
            <h3
              id="business-site-alternative"
              style={{ fontSize: "var(--text-h3-size)", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}
            >
              Discontinued Google business.site Alternative
            </h3>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
              Google used to offer a basic website builder built into Google Business Profile.{" "}
              <strong>That feature was discontinued in March 2024</strong>{" "}
              — businesses that relied on it were redirected back to their plain Business Profile,
              with no way to edit the old site.
            </p>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Neerzy picks up where that gap was left: your site is generated from the profile you
              already have, built for your trade, and — on a paid plan — kept in sync with it going
              forward, on a custom domain registered in your name.
            </p>
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

      {/* ── Section 2: transparent pricing ───────────────────── */}
      <section id="offer" className="section-padding" style={{ backgroundColor: "var(--color-bg-soft)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>Transparent, Zero-Friction Pricing</h2>
            {/* "free Google Business website" is placed verbatim: it is the
                fastest-growing query in the cluster (+900% YoY worldwide), and
                the pricing intro is the chunk AI answers quote numbers from. */}
            <p>
              Three numbers: a free Google Business website build, a $19 domain, and $
              {HOSTING_PRICE_USD}/month hosting after the first {HOSTING_FREE_DAYS} days — no setup
              fee, nothing to design or code. They match our{" "}
              <Link href="/pricing" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
                pricing page
              </Link>{" "}
              exactly.
            </p>
          </div>

          <div className="price-card">
            <div className="price-card-main">
              <span className="price-card-amount">FREE</span>
              <span className="price-card-once">to build &amp; preview your website</span>
            </div>
            {/* The three headline points lead the list — build, hosting, domain —
                so the numbers a snippet or an AI answer would quote are the first
                three things it reads. Everything after them is the fine print
                that keeps the page honest. All figures come from
                src/lib/website.ts so they can never drift from billing. */}
            <ul className="price-card-list">
              <li>
                <strong>Website build: 100% free.</strong> No setup fees. Your site is generated from
                your Google Business Profile — with the free Google Score audit, 5 Google posts and 5
                review requests for 30 days — and you can preview it as often as you like, no card.
              </li>
              <li>
                <strong>Hosting: first {HOSTING_FREE_DAYS} days free</strong>, then $
                {HOSTING_PRICE_USD}/month, cancel anytime. The free window starts the day you publish
                and runs for the full {HOSTING_FREE_DAYS} days.
              </li>
              <li>
                <strong>Custom domain: $19 one-time.</strong> Registered in your name, yours to keep.
                This is the one payment that unlocks publishing — connecting a domain you already own
                isn&apos;t available yet.
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
            <Link href="/signup?plan=free" className="btn btn-primary">
              {ctaLabel} →
            </Link>
            <p style={{ marginTop: "var(--space-3)", fontSize: "var(--text-small-size)", color: "var(--color-text-secondary)" }}>
              No credit card required to build and preview. Domain and hosting costs apply to publish
              and keep it live.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 3: FAQ ───────────────────────────────────── */}
      <section id="faqs" className="section-padding" style={{ backgroundColor: "var(--color-bg)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>Frequently Asked Questions</h2>
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
          <Link href="/signup?plan=free" className="btn btn-primary">
            {closingCtaLabel} →
          </Link>
        </div>
      </section>
    </>
  );
}
