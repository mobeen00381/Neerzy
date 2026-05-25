import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive WhatsApp Marketing Demo | Neerzy",
  description:
    "Try Neerzy live! Send a message or photo in our interactive WhatsApp simulator and watch AI generate Google posts, website content, and review requests in real-time.",
  alternates: {
    canonical: "https://www.neerzy.com/whatsapp-demo",
  },
  openGraph: {
    title: "Live WhatsApp Marketing Demo | Neerzy",
    description:
      "See how Neerzy turns a WhatsApp message into Google posts and website content automatically. Try it live — no signup required.",
    url: "https://www.neerzy.com/whatsapp-demo",
    siteName: "Neerzy",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neerzy WhatsApp Marketing Demo",
    description: "Try it live — send a WhatsApp message and watch AI generate your marketing content instantly.",
  },
};

export default function WhatsAppDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
