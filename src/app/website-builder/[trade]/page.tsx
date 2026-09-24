import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ROUTES, SITE_URL } from "@/lib/routes";
import { HOSTING_FREE_DAYS, HOSTING_PRICE_USD } from "@/lib/website";
import { getTradeSiteTemplate } from "@/lib/site-templates";
import {
  TRADE_LANDINGS,
  TRADE_LANDING_SLUGS,
  getTradeLanding,
} from "@/lib/website-builder-trades";

/**
 * /website-builder/<trade> — one SEO landing page per trade.
 *
 * Targets what a business owner actually types ("website for plumbers") while
 * the parent page keeps the product-level keyword. The ten pages come from
 * src/lib/website-builder-trades.ts; the template name and service lines shown
 * here are read from the REAL locked template (src/lib/site-templates.ts), so
 * this page can never promise something the builder does not produce.
 *
 * Metadata note: the parent layout (../layout.tsx) sets a canonical for
 * /website-builder, so every field that must differ here — title, description,
 * canonical, OG and Twitter — is deliberately re-declared, or these ten pages
 * would all point their canonical at the parent and could never be indexed.
 *
 * Prerendered at build time (force-static), so it costs nothing at runtime.
 */

export const dynamic = "force-static";

export function generateStaticParams() {
  return TRADE_LANDING_SLUGS.map((trade) => ({ trade }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ trade: string }>;
}): Promise<Metadata> {
  const { trade } = await params;
  const landing = getTradeLanding(trade);
  if (!landing) {
    return { title: { absolute: "Not found | Neerzy" }, robots: { index: false, follow: false } };
  }

  const url = `${SITE_URL}${ROUTES.WEBSITE_BUILDER}/${landing.slug}`;
  return {
    title: { absolute: landing.metaTitle },
    description: landing.metaDescription,
    keywords: landing.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: landing.h1,
      description: landing.metaDescription,
      images: [
        {
          url: `${SITE_URL}/og-images/website-builder.jpg`,
          width: 1200,
          height: 630,
          alt: `${landing.h1} — built from a Google Business Profile by Neerzy`,
        },
      ],
      siteName: "Neerzy",
    },
    twitter: {
      card: "summary_large_image",
      title: landing.h1,
      description: landing.metaDescription,
      images: [`${SITE_URL}/og-images/website-builder.jpg`],
    },
  };
}

export default async function TradeLandingPage({
  params,
}: {
  params: Promise<{ trade: string }>;
}) {
  const { trade } = await params;
  const landing = getTradeLanding(trade);
  if (!landing) notFound();

  // The REAL template this page demonstrates — template name, service lines and
  // colour way all come from here, never from hand-written copy.
  const def = getTradeSiteTemplate(landing.templateId);
  const pageUrl = `${SITE_URL}${ROUTES.WEBSITE_BUILDER}/${landing.slug}`;
  const others = TRADE_LANDINGS.filter((t) => t.slug !== landing.slug);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Website Builder",
        item: `${SITE_URL}${ROUTES.WEBSITE_BUILDER}`,
      },
      { "@type": "ListItem", position: 3, name: landing.h1, item: pageUrl },
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: landing.metaTitle,
    description: landing.metaDescription,
    isPartOf: { "@type": "WebSite", name: "Neerzy", url: SITE_URL },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: landing.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── Hero: the trade's problem, then why their profile solves it ── */}
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
                <Link href="/" style={{ color: "var(--color-text-secondary)" }}>Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={ROUTES.WEBSITE_BUILDER} style={{ color: "var(--color-text-secondary)" }}>
                  Website Builder
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{landing.h1}</li>
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
              {landing.h1}
            </h1>

            <p style={{ fontSize: "var(--text-body-size)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
              {landing.problem}
            </p>

            <p style={{ fontSize: "var(--text-body-size)", color: "var(--color-text-secondary)", marginBottom: "var(--space-5)" }}>
              {landing.whyProfile}
            </p>

            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
              <Link href={ROUTES.WEBSITE_BUILDER} className="btn btn-primary">
                See My Free Website Preview →
              </Link>
              {def && (
                <Link href={`/site/templates/${def.id}`} className="btn btn-secondary">
                  See the {def.name} template →
                </Link>
              )}
            </div>
            <p style={{ marginTop: "var(--space-3)", fontSize: "var(--text-small-size)", color: "var(--color-text-secondary)" }}>
              Free to preview — no card required. Publishing needs your own domain ($19, once).
            </p>
          </div>
        </div>
      </section>

      {/* ── What the real template already contains (from src/lib/site-templates.ts) ── */}
      {def && (
        <section className="section-padding" style={{ backgroundColor: "var(--color-bg-soft)", borderTop: "1px solid var(--color-divider)" }}>
          <div className="container">
            <div className="steps-header">
              <h2>What is already built into the {def.name} template</h2>
              <p>
                Every {def.tradeLabel} website starts with the same locked blocks, filled in from your
                Google Business Profile — so nothing on your site is a blank page you have to write.
              </p>
            </div>

            <ol
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: "var(--space-3)",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              {def.services.slice(0, 6).map((s) => (
                <li key={s.title} className="card" style={{ padding: "var(--space-4)" }}>
                  <h3 style={{ fontSize: "var(--text-h3-size)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
                    {s.title}
                  </h3>
                  <p style={{ color: "var(--color-text-secondary)" }}>{s.description}</p>
                </li>
              ))}
            </ol>

            <ul className="price-card-list" style={{ marginTop: "var(--space-5)", maxWidth: "820px" }}>
              <li>Your rating, reviews, photos, hours and address are filled in from your Google profile.</li>
              <li>Your service area and postcodes are listed, with a map centred on your location.</li>
              <li>Tap-to-call, WhatsApp and directions are one tap away on a phone.</li>
              <li>FAQs are written for your trade, in the format AI assistants quote.</li>
            </ul>
          </div>
        </section>
      )}

      {/* ── What it costs (same numbers as every Neerzy page) ── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>What it costs</h2>
            <p>One price to publish, whether you run one van or ten.</p>
          </div>

          <div className="price-card">
            <div className="price-card-main">
              <span className="price-card-amount">FREE</span>
              <span className="price-card-once">to preview your website</span>
            </div>
            <ul className="price-card-list">
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
                <strong>Live sync:</strong> new job photos and reviews update your site automatically
                on any paid plan.
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
            <Link href={ROUTES.WEBSITE_BUILDER} className="btn btn-primary">
              Build My Website — Free Preview →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trade FAQs (also emitted as FAQPage schema above) ── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg-soft)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>Questions this trade asks</h2>
          </div>

          <div style={{ display: "grid", gap: "var(--space-3)", maxWidth: "820px" }}>
            {landing.faqs.map((faq) => (
              <details key={faq.q} className="card" style={{ padding: 0, overflow: "hidden" }}>
                <summary
                  style={{
                    padding: "var(--space-4)",
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    fontFamily: "var(--font-family)",
                  }}
                >
                  {faq.q}
                </summary>
                <div
                  style={{
                    padding: "0 var(--space-4) var(--space-4)",
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--text-body-size)",
                    lineHeight: "var(--text-body-line)",
                  }}
                >
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Other trades: internal links hold the cluster together ── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>Website builder for other trades</h2>
          </div>
          <p style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", maxWidth: "900px" }}>
            {others.map((t) => (
              <Link
                key={t.slug}
                href={`${ROUTES.WEBSITE_BUILDER}/${t.slug}`}
                style={{ color: "var(--color-primary)", fontWeight: 600 }}
              >
                {t.h1.replace("Website Builder for ", "")}
              </Link>
            ))}
            <Link href={ROUTES.AUDIT_TOOL} style={{ color: "var(--color-primary)", fontWeight: 600 }}>
              Free Google Score audit
            </Link>
          </p>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="section-padding" style={{ backgroundColor: "var(--color-bg-soft)", borderTop: "1px solid var(--color-divider)" }}>
        <div className="container">
          <div className="steps-header">
            <h2>See your own website before you pay anything.</h2>
            <p>
              Search your business name and Neerzy shows the website it would build from your Google
              profile — free, in under a minute.
            </p>
          </div>
          <Link href={ROUTES.WEBSITE_BUILDER} className="btn btn-primary">
            Get My Free Website Preview →
          </Link>
        </div>
      </section>
    </>
  );
}
