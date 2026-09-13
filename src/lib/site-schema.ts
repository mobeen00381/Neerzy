import type { Metadata } from "next";
import { isServiceAreaData } from "./service-areas";

/**
 * One deterministic SEO / AEO / GEO surface for every trader website.
 *
 * Both the live custom-domain page (`/site`) and the 10 template demos
 * (`/site/templates/[trade]`) build their <head> and JSON-LD from here, so the
 * structured data can never drift between templates.
 *
 * Graph contents:
 *   LocalBusiness  — NAP, geo, opening hours, services, aggregateRating,
 *                    individual reviews, full PostalAddress, areaServed (the
 *                    real postal codes inside 10 km), hasMap
 *   WebSite        — site-level entity linked to the business
 *   WebPage        — page entity + `speakable` for voice/AI answers
 *   BreadcrumbList — crawl path
 *   FAQPage        — quotable Q&A (AEO)
 */

export type SiteSchemaInput = {
  content: any;
  /** Canonical site URL, e.g. https://blacksmith-hardware.com */
  url: string;
  /** Demo/template page → keeps template pages out of the index. */
  demo?: boolean;
};

/** Tidy a possibly-empty value for schema output. */
const s = (v: any): string | undefined => {
  const t = typeof v === "string" ? v.trim() : "";
  return t ? t : undefined;
};

/** Every photo on the content, de-duplicated (real photos first). */
export function siteImages(content: any): string[] {
  const c = content || {};
  const out: string[] = [];
  const push = (u: any) => {
    if (typeof u === "string" && u && !out.includes(u)) out.push(u);
  };
  push(c.heroImage);
  (Array.isArray(c.photos) ? c.photos : []).forEach(push);
  (Array.isArray(c.stockPhotos) ? c.stockPhotos : []).forEach(push);
  push(c.ogImage);
  return out;
}

/** GEO: the real places we serve — postal codes, localities, plus any label. */
export function siteAreaServed(content: any): any[] | undefined {
  const c = content || {};
  const areas: any[] = [];
  const push = (node: any) => {
    if (node && !areas.some((a) => JSON.stringify(a) === JSON.stringify(node))) areas.push(node);
  };

  if (isServiceAreaData(c.serviceAreas)) {
    for (const code of c.serviceAreas.postalCodes) {
      push({ "@type": "PostalCodeSpecification", postalCode: String(code) });
    }
    for (const town of c.serviceAreas.localities) {
      push({ "@type": "City", name: String(town) });
    }
  }
  const named = s(c.areaServed);
  if (named) push(named);
  else if (s(c.city)) push({ "@type": "City", name: String(c.city) });
  return areas.length ? areas : undefined;
}


/** Rating / review / pricing extras that make a LocalBusiness complete. */
function businessExtras(content: any) {
  const c = content || {};
  const reviews: any[] = Array.isArray(c.reviews) ? c.reviews : [];
  return {
    ...(c.priceRange ? { priceRange: String(c.priceRange) } : {}),
    ...(reviews.length
      ? {
          review: reviews.slice(0, 5).map((r: any) => ({
            "@type": "Review",
            author: { "@type": "Person", name: String(r.author || "Customer") },
            reviewRating: { "@type": "Rating", ratingValue: Number(r.rating) || 5, bestRating: 5 },
            ...(r.text ? { reviewBody: String(r.text) } : {}),
          })),
        }
      : {}),
  };
}

export function buildSiteSchemaGraph({ content, url, demo = false }: SiteSchemaInput) {
  const c = content || {};
  const images = siteImages(c);
  const services: any[] = Array.isArray(c.services) ? c.services : [];
  const faqs: any[] = Array.isArray(c.faqs) ? c.faqs : [];
  const hoursSpec: any[] = Array.isArray(c.hoursSpec) ? c.hoursSpec : [];
  const areaServed = siteAreaServed(c);
  const geo =
    c.geo?.lat && c.geo?.lng
      ? { "@type": "GeoCoordinates", latitude: Number(c.geo.lat), longitude: Number(c.geo.lng) }
      : undefined;

  const business: any = {
    "@type": "LocalBusiness",
    "@id": `${url}#business`,
    name: s(c.businessName),
    description: s(c.seo?.description) || s(c.about),
    url,
    ...(s(c.phone) ? { telephone: s(c.phone) } : {}),
    ...(images.length ? { image: images.slice(0, 6) } : {}),
    ...(geo ? { geo } : {}),
    ...(areaServed ? { areaServed } : {}),
    ...(s(c.mapUrl) ? { hasMap: s(c.mapUrl) } : {}),
    ...(s(c.address) || s(c.postalCode) || s(c.city)
      ? {
          address: {
            "@type": "PostalAddress",
            ...(s(c.address) ? { streetAddress: s(c.address) } : {}),
            ...(s(c.city) ? { addressLocality: s(c.city) } : {}),
            ...(s(c.region) ? { addressRegion: s(c.region) } : {}),
            ...(s(c.postalCode) ? { postalCode: s(c.postalCode) } : {}),
            ...(s(c.country) ? { addressCountry: s(c.country) } : {}),
          },
        }
      : {}),
    ...(s(c.sameAs) ? { sameAs: [s(c.sameAs)] } : {}),
    ...(hoursSpec.length
      ? {
          openingHoursSpecification: hoursSpec.map((h: any) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: `https://schema.org/${h.dayOfWeek}`,
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
    ...(c.rating && c.userRatingsTotal
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(c.rating),
            reviewCount: Number(c.userRatingsTotal),
            bestRating: 5,
          },
        }
      : {}),
    ...(services.length
      ? {
          makesOffer: services.slice(0, 8).map((sv: any) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: sv.title,
              ...(sv.description ? { description: sv.description } : {}),
              ...(areaServed ? { areaServed } : {}),
            },
          })),
        }
      : {}),
    ...businessExtras(c),
  };

  const faqPage = faqs.length
    ? {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faqs.map((f: any) => ({
          "@type": "Question",
          name: String(f.q),
          acceptedAnswer: { "@type": "Answer", text: String(f.a) },
        })),
      }
    : null;

  const webPage: any = {
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: s(c.seo?.title) || s(c.businessName),
    isPartOf: { "@id": `${url}#website` },
    about: { "@id": `${url}#business` },
    inLanguage: "en",
    ...(c.generatedAt ? { dateModified: String(c.generatedAt) } : {}),
    ...(s(c.hero?.subheadline)
      ? {
          description: s(c.hero.subheadline),
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: ["h1", "#about p", "#faq summary"],
          },
        }
      : {}),
  };

  const graph: any[] = [
    business,
    {
      "@type": "WebSite",
      "@id": `${url}#website`,
      url,
      name: s(c.businessName),
      publisher: { "@id": `${url}#business` },
      inLanguage: "en",
    },
    webPage,
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumbs`,
      itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: url }],
    },
    ...(faqPage ? [faqPage] : []),
  ];

  return { "@context": "https://schema.org", "@graph": graph };
}

/** <head> for a trader website (and its demo twin — which stays noindex). */
export function buildSiteMetadata({ content, url, demo = false }: SiteSchemaInput): Metadata {
  const c = content || {};
  const title = s(c.seo?.title) || `${c.businessName || "Local Services"} | Local Services`;
  const description = s(c.seo?.description) || s(c.hero?.subheadline) || "";
  const images = siteImages(c).slice(0, 1);
  const place = s(c.city) || s(c.areaServed);

  return {
    // `absolute` keeps the trader's own title exactly as written: the root
    // layout appends "| Neerzy" to anything else, which does not belong on a
    // customer's own domain.
    title: { absolute: title },
    description,
    keywords: Array.isArray(c.keywords) && c.keywords.length ? c.keywords : undefined,
    alternates: { canonical: url },
    robots: demo ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: s(c.businessName) || url,
      type: "website",
      ...(images.length ? { images: [{ url: images[0], alt: title }] } : {}),
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title,
      description,
      ...(images.length ? { images: [images[0]] } : {}),
    },
    // GEO (geographic) signals for local search + AI answer engines
    other: {
      ...(place ? { "geo.placename": place } : {}),
      ...(c.geo?.lat && c.geo?.lng
        ? {
            "geo.position": `${c.geo.lat};${c.geo.lng}`,
            ICBM: `${c.geo.lat}, ${c.geo.lng}`,
          }
        : {}),
    },
  };
}

