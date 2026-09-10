import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import SiteRenderer from "@/components/site/SiteRenderer";
import { getSiteByHost, getSitePosts, normalizeHost } from "@/lib/site-data";

// Always resolve the current domain + latest content (never cached cross-domain)
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const site = await getSiteByHost(host);
  if (!site) return { title: "Not found" };

  const c = site.content || {};
  const h = normalizeHost(host);
  const url = `https://${h}`;
  const title = c.seo?.title || `${c.businessName || h} | Local Services`;
  const description = c.seo?.description || c.hero?.subheadline || "";

  return {
    title,
    description,
    keywords: Array.isArray(c.keywords) && c.keywords.length ? c.keywords : undefined,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: c.businessName || h,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    // GEO signals for local/AI search
    other: {
      ...(c.areaServed ? { "geo.placename": String(c.areaServed) } : {}),
      ...(c.geo?.lat && c.geo?.lng
        ? {
            "geo.position": `${c.geo.lat};${c.geo.lng}`,
            ICBM: `${c.geo.lat}, ${c.geo.lng}`,
          }
        : {}),
    },
  };
}

export default async function TraderSitePage() {
  const host = (await headers()).get("host");
  const site = await getSiteByHost(host);
  if (!site || !site.preview_ready) notFound();

  const posts = await getSitePosts(site.user_id, 6);
  const c = site.content || {};
  const h = normalizeHost(host);
  const url = `https://${h}`;

  const services: any[] = Array.isArray(c.services) ? c.services : [];
  const faqs: any[] = Array.isArray(c.faqs) ? c.faqs : [];
  const hoursSpec: any[] = Array.isArray(c.hoursSpec) ? c.hoursSpec : [];
  const photos: string[] = Array.isArray(c.photos) ? c.photos : [];

  // ── SEO / AEO / GEO — one deterministic schema graph (system-managed) ──
  const business: any = {
    "@type": "LocalBusiness",
    "@id": `${url}#business`,
    name: c.businessName,
    description: c.seo?.description || c.about || "",
    url,
    telephone: c.phone || undefined,
    image: photos.slice(0, 3).length ? photos.slice(0, 3) : undefined,
    address: c.address
      ? { "@type": "PostalAddress", streetAddress: c.address }
      : undefined,
    sameAs: c.sameAs ? [c.sameAs] : undefined,
    areaServed: c.areaServed || undefined,
    geo:
      c.geo?.lat && c.geo?.lng
        ? { "@type": "GeoCoordinates", latitude: c.geo.lat, longitude: c.geo.lng }
        : undefined,
    openingHoursSpecification: hoursSpec.length
      ? hoursSpec.map((s: any) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: `https://schema.org/${s.dayOfWeek}`,
          opens: s.opens,
          closes: s.closes,
        }))
      : undefined,
    ...(c.rating && c.userRatingsTotal
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: c.rating,
            reviewCount: c.userRatingsTotal,
          },
        }
      : {}),
    makesOffer: services.length
      ? services.map((s: any) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: s.title, description: s.description },
        }))
      : undefined,
  };

  const faqPage = faqs.length
    ? {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faqs.map((f: any) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      business,
      { "@type": "WebSite", "@id": `${url}#website`, url, name: c.businessName, publisher: { "@id": `${url}#business` } },
      {
        "@type": "BreadcrumbList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: url }],
      },
      ...(faqPage ? [faqPage] : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
      />
      <SiteRenderer content={c} posts={posts} />
    </>
  );
}
