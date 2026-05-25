import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | Neerzy – Simple WhatsApp Marketing Plans for Local Businesses",
  description:
    "Start free with 5 posts. Upgrade to Pro ($39/mo), Growth ($79/mo), or Agency ($199/mo) for unlimited local marketing automation via WhatsApp. No dashboards. No tech skills needed.",
  alternates: {
    canonical: "https://www.neerzy.com/pricing",
  },
  openGraph: {
    title: "Neerzy Pricing | Simple Plans for Local Business Marketing",
    description:
      "Turn every job into a Google post, website update, and review request via WhatsApp. Free plan available. Upgrade anytime.",
    url: "https://www.neerzy.com/pricing",
    siteName: "Neerzy",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neerzy Pricing | Start Free",
    description:
      "Start with 5 free posts. No credit card required. Upgrade anytime for more posts and features.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
