import type { Metadata } from "next";
import { ROUTES, SITE_URL } from "@/lib/routes";

const PAGE_URL = `${SITE_URL}${ROUTES.WEBSITE_BUILDER}`;

export const metadata: Metadata = {
  // "absolute" bypasses the root layout "%s | Neerzy" title template so the
  // brand isn't appended twice (same pattern as gmb-audit-tool/layout.tsx).
  // 55 chars, primary keyword leading, brand trailing.
  title: {
    absolute: "Website Builder Synced With Your Google Business Profile | Neerzy",
  },
  description:
    "Build a website from your Google Business Profile in one tap — synced as your profile changes. Setup fee waived and first 90 days of hosting free for early adopters.",
  keywords: [
    "website builder that syncs with google business profile",
    "build website from google my business profile",
    "website builder for google business profile",
    "build a website from gbp",
    "google business profile website",
    "website builder for local service businesses",
    "trade website templates",
    "gmb website builder",
    "google my business website builder",
    "website for plumbers",
    "website for electricians",
    "website for hvac contractors",
  ],
  authors: [{ name: "Neerzy" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    type: "website",
    url: PAGE_URL,
    title: "The Website Builder That Stays in Sync With Your Google Business Profile",
    description:
      "Build a website from your Google Business Profile in one tap — synced as your profile changes. Setup fee waived and first 90 days of hosting free for early adopters.",
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
    title: "Website Builder Synced With Your Google Business Profile",
    description:
      "One tap. Synced from Google. Setup fee waived and 90 days of free hosting for early adopters.",
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
