import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Neerzy | Local Business Marketing Made Simple via WhatsApp",
  description:
    "Learn how Neerzy helps hardworking local traders grow online. We make marketing simple — finish a job, send a WhatsApp message, and stay active online consistently.",
  alternates: {
    canonical: "https://www.neerzy.com/about",
  },
  openGraph: {
    title: "About Neerzy | Built for Local Traders",
    description:
      "Neerzy makes it simple for local tradespeople to stay visible online. No marketing skills needed.",
    url: "https://www.neerzy.com/about",
    siteName: "Neerzy",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Neerzy | Marketing for Local Traders",
    description:
      "Neerzy helps local tradespeople grow online via WhatsApp. No marketing skills needed.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
