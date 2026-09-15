import AuditToolClient from "./AuditToolClient";
import AuditReviewsSection from "@/components/reviews/AuditReviewsSection";
import { GMB_AUDIT_FAQS } from "@/lib/gmb-audit-faqs";
import {
  auditAggregateRating,
  getPublishedAuditReviews,
} from "@/lib/audit-reviews";

/**
 * /gmb-audit-tool — server component.
 *
 * The interactive tool is a client component (./AuditToolClient). Everything
 * that must exist in the server-rendered HTML for crawlers lives here: all
 * three JSON-LD blocks, the visible reviews section, and the review numbers
 * the AggregateRating is built from.
 *
 * Reviews change slowly and this is one of the highest-intent pages on the
 * site, so it stays statically prerendered and revalidates hourly. Publishing
 * a review in /admin also calls revalidatePath("/gmb-audit-tool"), so in
 * practice an approved review appears within seconds.
 */
export const revalidate = 3600;

export default async function GBMAuditToolPage() {
  // One query result. The SAME object feeds the visible section and the
  // AggregateRating below — they cannot disagree.
  const published = await getPublishedAuditReviews();
  const aggregateRating = auditAggregateRating(published);

  // Schema.org structured data - SoftwareApplication (the tool itself).
  // aggregateRating is omitted entirely until there are enough real reviews
  // that a visitor can read on the page (REVIEW_SCHEMA_MIN in
  // src/lib/audit-reviews.ts). No reviews → no stars.
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Neerzy GMB Audit Tool",
    "applicationCategory": "SEO",
    "operatingSystem": "Web",
    "url": "https://www.neerzy.com/gmb-audit-tool",
    "description": "Free GMB audit tool to check your Google Business Profile SEO. Run an instant local SEO audit of your GBP listing with actionable recommendations to improve local search rankings.",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    ...(aggregateRating ? { aggregateRating } : {}),
  };

  // Schema.org structured data - BreadcrumbList: Home > GMB Checker
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.neerzy.com/" },
      { "@type": "ListItem", "position": 2, "name": "GMB Checker", "item": "https://www.neerzy.com/gmb-audit-tool" }
    ]
  };

  // Schema.org structured data - FAQPage, built from the same array the
  // accordion in AuditToolClient renders (Google requires the two to match).
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": GMB_AUDIT_FAQS.map((faq) => ({ "@type": "Question", "name": faq.question, "acceptedAnswer": { "@type": "Answer", "text": faq.answer } }))
  };

  return (
    <>
      {/* SEO: JSON-LD structured data (SoftwareApplication, FAQPage, BreadcrumbList) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ background: "var(--color-bg-soft)", fontFamily: "var(--font-family)" }}>
        <AuditToolClient />

        <div
          className="container"
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "0 var(--space-4) var(--space-7)",
          }}
        >
          {/* The visible proof behind any AggregateRating emitted above. */}
          <AuditReviewsSection published={published} />
        </div>
      </div>
    </>
  );
}
