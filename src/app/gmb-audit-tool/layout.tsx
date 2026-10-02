import type { Metadata } from "next";

// Single source of truth for this page's title. It previously drifted into
// THREE different strings — `<title>`, og:title and twitter:title each said
// something different — which is how one page ends up with three competing
// "canonical" titles. Every consumer below reads this one constant.
const CANONICAL_TITLE =
  "Free GMB Audit Tool | Google Business Profile Audit in 30 Seconds";

export const metadata: Metadata = {
  // "absolute" bypasses the root layout "%s | Neerzy" title template so the
  // brand isn't appended twice. Title leads with the primary keyword
  // "GMB Audit Tool" (SEO brief, section 2).
  title: {
    absolute: CANONICAL_TITLE,
  },
  description:
    "Run a free 30-second Google Business Profile audit. Get an instant local SEO score covering completeness, reviews, engagement, and photos. No signup required.",
  keywords: [
    "gmb audit tool",
    "gbp audit tool",
    "gmb audit",
    "google business profile audit",
    "google my business audit tool",
    "local SEO audit",
    "gbp audit for local seo",
    "free gbp audit",
    "GMB audit free",
    "google my business checker",
    "GBP checker",
    "Google Business Profile optimizer",
    "free GBP analysis",
  ],
  authors: [{ name: "Neerzy" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://www.neerzy.com/gmb-audit-tool",
  },
  openGraph: {
    type: "website",
    url: "https://www.neerzy.com/gmb-audit-tool",
    title: CANONICAL_TITLE,
    description:
      "Run a free GMB audit tool scan on any Google Business Profile. Get an instant local SEO audit score and see what's hurting your rankings.",
    images: [
      {
        url: "https://www.neerzy.com/og-images/gbp-audit-tool.jpg",
        width: 1200,
        height: 630,
        alt: "GMB audit tool dashboard showing GBP audit score",
      },
    ],
    siteName: "Neerzy",
  },
  twitter: {
    card: "summary_large_image",
    title: CANONICAL_TITLE,
    description:
      "Run a free GMB audit tool scan on any Google Business Profile. Instant local SEO audit score, no signup required.",
    images: ["https://www.neerzy.com/og-images/gbp-audit-tool.jpg"],
  },
};

export default function GmbAuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
