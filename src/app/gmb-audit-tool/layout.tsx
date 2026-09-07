import type { Metadata } from "next";

export const metadata: Metadata = {
  // "absolute" bypasses the root layout "%s | Neerzy" title template so the
  // brand isn't appended twice. Title is 60 chars with the primary keyword
  // "GMB Audit Tool" leading (SEO brief, section 2).
  title: {
    absolute: "Free GMB Audit Tool | Google Business Profile Audit - Neerzy",
  },
  description:
    "Run a free GMB audit tool scan on any Google Business Profile. Get an instant local SEO audit score, see what's hurting your rankings, and fix it in seconds. No signup required.",
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
    title: "Free GMB Audit Tool | Google Business Profile Audit in 30 Seconds",
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
    title: "Free GMB Audit Tool | Google Business Profile Audit",
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
