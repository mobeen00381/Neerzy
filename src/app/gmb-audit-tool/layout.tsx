import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Google Business Profile Audit Tool | GBP Checker 2026 - Neerzy",
  description:
    "Free Google Business Profile audit tool. Check your GBP/GMB listing SEO in 30 seconds. Get instant score, actionable recommendations & improve local search rankings. No signup required.",
  keywords: [
    "google business profile audit",
    "GBP audit tool",
    "GMB audit free",
    "google my business checker",
    "local SEO audit",
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
    title: "Free Google Business Profile Audit Tool | Check Your GBP Score",
    description:
      "Free GBP audit tool. Analyze your Google Business Profile in seconds. Get actionable SEO recommendations to rank higher locally.",
    images: [
      {
        url: "https://www.neerzy.com/og-images/gbp-audit-tool.jpg",
        width: 1200,
        height: 630,
        alt: "Neerzy Free GBP Audit Tool",
      },
    ],
    siteName: "Neerzy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Google Business Profile Audit Tool | GBP Checker",
    description:
      "Free GBP audit tool. Check your Google Business Profile SEO score in 30 seconds. Get instant recommendations.",
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
