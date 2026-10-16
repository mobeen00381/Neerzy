import type { Metadata } from "next";
import { ROUTES, SITE_URL } from "@/lib/routes";

const PAGE_URL = `${SITE_URL}${ROUTES.WEBSITE_BUILDER}`;

export const metadata: Metadata = {
  // "absolute" bypasses the root layout "%s | Neerzy" title template so the
  // brand isn't appended twice (same pattern as gmb-audit-tool/layout.tsx).
  // 48 chars, exact-match head keyword leading, brand trailing.
  title: {
    absolute: "Google Business Profile Website Builder | Neerzy",
  },
  // 141 chars: outcome first ("free website"), then the zero-friction facts
  // (data pulled in for you, 90 days free hosting, no coding) that win the
  // snippet. Deliberately says "pulls in" rather than "auto-syncs": the
  // recurring sync is a paid-plan feature (WEBSITE_SYNC_ELIGIBLE_PLANS), and a
  // snippet that overpromises it would set up a paywall disappointment.
  description:
    "Build a free website from your Google Business Profile in 60s. Pulls in reviews, photos & hours. First 90 days hosting free. No coding needed.",
  // Ordered by measured worldwide opportunity (Keyword Planner, Oct 2025–Sep
  // 2026): the two 5,000/mo head terms lead, then the exact-match phrase, then
  // the transition-intent "gmb to website" cluster that planners can't size but
  // that converts hardest (a profile owner looking for a site right now).
  keywords: [
    "google business profile website",
    "free google business website",
    "google business profile website builder",
    "gmb to website",
    "google business site free",
    "website builder that syncs with google business profile",
    "build website from google my business profile",
    "website builder for google business profile",
    "build a website from gbp",
    "website builder for local service businesses",
    "trade website templates",
    "gmb website builder",
    "google my business website builder",
    "website for plumbers",
    "website for electricians",
    "website for hvac contractors",
  ],
  authors: [{ name: "Neerzy" }],
  // Unrestricted snippets + large image previews: the page IS the answer to a
  // single, high-intent query, so we want the widest possible SERP/Discover
  // real estate (same directives as the site-wide default in app/layout.tsx).
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    title: "The Instant Google Business Profile Website Builder",
    description:
      "Turn your Google Business Profile into a fast, mobile-friendly website in 60 seconds. Free setup with 90 days of free hosting.",
    images: [
      {
        url: `${SITE_URL}/og-images/website-builder.jpg`,
        width: 1200,
        height: 630,
        alt: "Neerzy website builder syncing a local business website with its Google Business Profile",
      },
    ],
    siteName: "Neerzy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Business Profile Website Builder",
    description:
      "Build a free website from your Google Business Profile in 60 seconds. 90 days of hosting free, no coding needed.",
    images: [`${SITE_URL}/og-images/website-builder.jpg`],
  },
};

export default function WebsiteBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
