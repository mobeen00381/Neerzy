import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/og";

export const metadata: Metadata = {
  title: "WhatsApp Marketing Plans & Pricing",
  description:
    "Start free — your first 30 days include 5 Google posts and 5 review requests, no card needed. Then Pro ($39/mo), Growth ($79/mo) or Agency ($199/mo).",
  alternates: {
    canonical: "https://www.neerzy.com/pricing",
  },
  openGraph: {
    title: "WhatsApp Marketing Plans & Pricing",
    description:
      "Turn every job into a Google post, website update, and review request via WhatsApp. Start free — your first 30 days include 5 posts and 5 review requests.",
    url: "https://www.neerzy.com/pricing",
    siteName: "Neerzy",
    locale: "en_US",
    type: "website",
    images: [DEFAULT_OG_IMAGE],  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE.url],    title: "WhatsApp Marketing Plans & Pricing",
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
